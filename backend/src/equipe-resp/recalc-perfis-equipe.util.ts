import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Aceita tanto o Logger padrão do Nest quanto o LoggerWithLog (que persiste em log_generico). */
type MinimalLogger = { verbose: (message: string, ...args: any[]) => void };

const fallbackLogger = new Logger('recalcPerfisEquipeColunas');

/**
 * Recálculo dos campos pessoa.perfis_equipe_pdm e pessoa.perfis_equipe_ps,
 * com base nas equipes ativas em que a pessoa participa, considerando:
 *  - PdmPerfil (vínculo explícito equipe ↔ PDM/PS via Meta/Iniciativa/Atividade/Etapa)
 *  - VariavelGrupoResponsavelEquipe (equipe vinculada a variáveis via medição/validação/liberação).
 *    Para variáveis Global (sem vínculo com PDM/PS), o perfil é adicionado em ambos os conjuntos.
 *    Para demais variáveis, o tipo (PDM ou PS) é resolvido pelo indicador → meta → pdm.
 *
 * Todo o cálculo é feito em uma única query set-based (CTE + UPDATE ... IS DISTINCT FROM),
 * tanto para o recalc-full-db quanto para os recálculos por evento (escopados por pessoa).
 * Importante para evitar lock contention: um único UPDATE adquire os row locks de pessoa em
 * ordem consistente e por pouco tempo, ao contrário do antigo loop por pessoa que segurava
 * locks durante queries pesadas de derivação (causava 504/bloqueios em produção).
 */
export type RecalculaPessoaPdmTiposResult = {
    /** true quando os perfis (PDM e/ou PS) da pessoa foram efetivamente alterados */
    changed: boolean;
};

export type RecalcPerfisEquipeResult = {
    /** quantas pessoas tiveram os perfis efetivamente alterados */
    updated: number;
    /** quantas pessoas foram consideradas no recálculo */
    total: number;
};

/**
 * Recalcula perfis_equipe_pdm/perfis_equipe_ps em uma única query.
 *
 * - Sem `pessoaIds`: recalcula TODAS as pessoas ativas (desativado = false) — modo recalc-full-db.
 * - Com `pessoaIds`: recalcula apenas as pessoas informadas, independente de desativado
 *   (mesmo comportamento do antigo recálculo por evento).
 */
export async function recalcPerfisEquipeColunas(
    prismaTx: Prisma.TransactionClient,
    pessoaIds?: number[],
    logger?: MinimalLogger
): Promise<RecalcPerfisEquipeResult> {
    if (pessoaIds && pessoaIds.length === 0) return { updated: 0, total: 0 };

    const filtroPessoa = pessoaIds ? Prisma.sql`p.id = ANY(${pessoaIds}::int[])` : Prisma.sql`p.desativado = false`;

    const startedAt = Date.now();
    const result = await prismaTx.$queryRaw<{ updated: number; total: number }[]>`
        WITH pessoa_equipe AS (
            SELECT p.id AS pessoa_id, gre.id AS equipe_id, gre.perfil
            FROM pessoa p
            LEFT JOIN grupo_responsavel_equipe_pessoa grep
                ON grep.pessoa_id = p.id AND grep.removido_em IS NULL
            LEFT JOIN grupo_responsavel_equipe gre
                ON gre.id = grep.grupo_responsavel_equipe_id AND gre.removido_em IS NULL
            WHERE ${filtroPessoa}
        ),
        pdm_perfil_tipos AS (
            SELECT pe.pessoa_id, pe.perfil, pdm.tipo::text AS tipo
            FROM pessoa_equipe pe
            JOIN pdm_perfil pp ON pp.equipe_id = pe.equipe_id AND pp.removido_em IS NULL
            JOIN pdm ON pdm.id = pp.pdm_id AND pdm.removido_em IS NULL
        ),
        variavel_tipos AS (
            SELECT
                pe.pessoa_id,
                pe.perfil,
                CASE
                    WHEN v.tipo = 'Global' THEN ARRAY['PDM','PS']
                    ELSE ARRAY(
                        SELECT DISTINCT pdm_v.tipo::text
                        FROM indicador_variavel iv
                        JOIN indicador ind ON ind.id = iv.indicador_id
                        LEFT JOIN meta m ON m.id = ind.meta_id
                        LEFT JOIN iniciativa ini ON ini.id = ind.iniciativa_id
                        LEFT JOIN meta mi ON mi.id = ini.meta_id
                        LEFT JOIN atividade ati ON ati.id = ind.atividade_id
                        LEFT JOIN iniciativa inia ON inia.id = ati.iniciativa_id
                        LEFT JOIN meta ma ON ma.id = inia.meta_id
                        JOIN pdm pdm_v ON pdm_v.id = COALESCE(m.pdm_id, mi.pdm_id, ma.pdm_id)
                            AND pdm_v.removido_em IS NULL
                        WHERE iv.variavel_id = v.id AND iv.desativado = false
                    )
                END AS tipos
            FROM pessoa_equipe pe
            JOIN variavel_grupo_responsavel_equipe vgre
                ON vgre.grupo_responsavel_equipe_id = pe.equipe_id AND vgre.removido_em IS NULL
            JOIN variavel v ON v.id = vgre.variavel_id AND v.removido_em IS NULL
        ),
        combined AS (
            SELECT pessoa_id, perfil, tipo FROM pdm_perfil_tipos
            UNION ALL
            SELECT pessoa_id, perfil, UNNEST(tipos) AS tipo FROM variavel_tipos
        ),
        computed AS (
            SELECT
                p.id AS pessoa_id,
                COALESCE(array_agg(DISTINCT c.perfil) FILTER (WHERE c.tipo = 'PDM'), '{}') AS perfis_pdm,
                COALESCE(array_agg(DISTINCT c.perfil) FILTER (WHERE c.tipo = 'PS'), '{}') AS perfis_ps
            FROM pessoa p
            LEFT JOIN combined c ON c.pessoa_id = p.id
            WHERE ${filtroPessoa}
            GROUP BY p.id
        ),
        do_update AS (
            UPDATE pessoa SET
                perfis_equipe_pdm = computed.perfis_pdm::"PerfilResponsavelEquipe"[],
                perfis_equipe_ps = computed.perfis_ps::"PerfilResponsavelEquipe"[]
            FROM computed
            WHERE pessoa.id = computed.pessoa_id
            AND (pessoa.perfis_equipe_pdm IS DISTINCT FROM computed.perfis_pdm::"PerfilResponsavelEquipe"[]
                 OR pessoa.perfis_equipe_ps IS DISTINCT FROM computed.perfis_ps::"PerfilResponsavelEquipe"[])
            RETURNING 1
        )
        SELECT
            (SELECT count(*)::int FROM do_update) AS updated,
            (SELECT count(*)::int FROM computed) AS total
    `;

    const tookMs = Date.now() - startedAt;
    const escopo = pessoaIds ? `${pessoaIds.length} pessoa(s) no escopo` : 'todas as pessoas ativas';
    (logger ?? fallbackLogger).verbose(
        `Recalc perfis de equipe (${escopo}): ${result[0].updated}/${result[0].total} pessoa(s) alterada(s), took ${tookMs}ms`
    );

    return result[0];
}

export async function recalculaPessoaPdmTipos(
    pessoaId: number,
    prismaTx: Prisma.TransactionClient
): Promise<RecalculaPessoaPdmTiposResult> {
    const { updated } = await recalcPerfisEquipeColunas(prismaTx, [pessoaId]);
    return { changed: updated > 0 };
}

/**
 * Encontra todas as pessoas participantes ativas das equipes informadas
 * e recalcula seus perfis_equipe_pdm/perfis_equipe_ps.
 */
export async function recalcPessoasAfetadasPorEquipes(
    equipeIds: number[],
    prismaTx: Prisma.TransactionClient,
    logger?: MinimalLogger
) {
    if (equipeIds.length === 0) return;

    const participantes = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
        where: {
            grupo_responsavel_equipe_id: { in: equipeIds },
            removido_em: null,
        },
        select: { pessoa_id: true },
        distinct: ['pessoa_id'],
    });

    await recalcPerfisEquipeColunas(
        prismaTx,
        participantes.map((p) => p.pessoa_id),
        logger
    );
}
