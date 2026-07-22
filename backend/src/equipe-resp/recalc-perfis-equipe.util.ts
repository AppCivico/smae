import { PerfilResponsavelEquipe, Prisma } from '@prisma/client';

/**
 * Recalcula os campos perfis_equipe_pdm e perfis_equipe_ps de uma pessoa,
 * com base nas equipes ativas em que ela participa, considerando:
 *  - PdmPerfil (vínculo explícito equipe ↔ PDM/PS via Meta/Iniciativa/Atividade/Etapa)
 *  - VariavelGrupoResponsavelEquipe (equipe vinculada a variáveis via medição/validação/liberação).
 *    Para variáveis Global (sem vínculo com PDM/PS), o perfil é adicionado em ambos os conjuntos.
 *    Para demais variáveis, o tipo (PDM ou PS) é resolvido pelo indicador → meta → pdm.
 */
export type RecalculaPessoaPdmTiposResult = {
    /** true quando os perfis (PDM e/ou PS) da pessoa foram efetivamente alterados */
    changed: boolean;
};

function perfisSaoIguais(a: PerfilResponsavelEquipe[], b: PerfilResponsavelEquipe[]): boolean {
    if (a.length !== b.length) return false;
    const setB = new Set(b);
    return a.every((p) => setB.has(p));
}

export async function recalculaPessoaPdmTipos(
    pessoaId: number,
    prismaTx: Prisma.TransactionClient
): Promise<RecalculaPessoaPdmTiposResult> {
    const pessoaAtual = await prismaTx.pessoa.findUniqueOrThrow({
        where: { id: pessoaId },
        select: { perfis_equipe_pdm: true, perfis_equipe_ps: true },
    });

    const equipes = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
        where: {
            pessoa_id: pessoaId,
            removido_em: null,
        },
        select: { grupo_responsavel_equipe: { select: { id: true } } },
    });
    const equipeIds = equipes.map((e) => e.grupo_responsavel_equipe.id);

    const perfisPdm = new Set<PerfilResponsavelEquipe>();
    const perfisPs = new Set<PerfilResponsavelEquipe>();

    if (equipeIds.length === 0) {
        const changed =
            !perfisSaoIguais(pessoaAtual.perfis_equipe_pdm, []) ||
            !perfisSaoIguais(pessoaAtual.perfis_equipe_ps, []);
        if (changed) {
            await prismaTx.pessoa.update({
                where: { id: pessoaId },
                data: { perfis_equipe_pdm: [], perfis_equipe_ps: [] },
            });
        }
        return { changed };
    }

    const pdmTiposEPerfis = await prismaTx.pdm.findMany({
        where: {
            removido_em: null,
            PdmPerfil: {
                some: {
                    equipe_id: { in: equipeIds },
                    removido_em: null,
                },
            },
        },
        select: {
            tipo: true,
            PdmPerfil: {
                select: { equipe: { select: { perfil: true } } },
                where: {
                    equipe_id: { in: equipeIds },
                    removido_em: null,
                },
            },
        },
    });

    for (const item of pdmTiposEPerfis) {
        item.PdmPerfil.forEach((perfil) => {
            if (item.tipo === 'PDM') {
                perfisPdm.add(perfil.equipe.perfil);
            } else if (item.tipo === 'PS') {
                perfisPs.add(perfil.equipe.perfil);
            }
        });
    }

    const vinculosVariavel = await prismaTx.variavelGrupoResponsavelEquipe.findMany({
        where: {
            grupo_responsavel_equipe_id: { in: equipeIds },
            removido_em: null,
            variavel: { removido_em: null },
        },
        select: {
            grupo_responsavel_equipe: { select: { perfil: true } },
            variavel: {
                select: {
                    tipo: true,
                    indicador_variavel: {
                        where: { desativado: false },
                        select: {
                            indicador: {
                                select: {
                                    meta: { select: { pdm: { select: { tipo: true } } } },
                                    iniciativa: {
                                        select: { meta: { select: { pdm: { select: { tipo: true } } } } },
                                    },
                                    atividade: {
                                        select: {
                                            iniciativa: {
                                                select: { meta: { select: { pdm: { select: { tipo: true } } } } },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    for (const vinculo of vinculosVariavel) {
        const perfil = vinculo.grupo_responsavel_equipe.perfil;

        if (vinculo.variavel.tipo === 'Global') {
            // Variáveis Global não pertencem a um PDM/PS específico — conferimos o perfil em ambos.
            perfisPdm.add(perfil);
            perfisPs.add(perfil);
            continue;
        }

        for (const iv of vinculo.variavel.indicador_variavel) {
            const pdmTipo =
                iv.indicador.meta?.pdm?.tipo ??
                iv.indicador.iniciativa?.meta?.pdm?.tipo ??
                iv.indicador.atividade?.iniciativa?.meta?.pdm?.tipo;

            if (pdmTipo === 'PDM') perfisPdm.add(perfil);
            else if (pdmTipo === 'PS') perfisPs.add(perfil);
        }
    }

    const novosPerfisPdm = Array.from(perfisPdm);
    const novosPerfisPs = Array.from(perfisPs);

    const changed =
        !perfisSaoIguais(pessoaAtual.perfis_equipe_pdm, novosPerfisPdm) ||
        !perfisSaoIguais(pessoaAtual.perfis_equipe_ps, novosPerfisPs);

    if (changed) {
        await prismaTx.pessoa.update({
            where: { id: pessoaId },
            data: {
                perfis_equipe_pdm: novosPerfisPdm,
                perfis_equipe_ps: novosPerfisPs,
            },
        });
    }

    return { changed };
}

/**
 * Encontra todas as pessoas participantes ativas das equipes informadas
 * e recalcula seus perfis_equipe_pdm/perfis_equipe_ps.
 */
export async function recalcPessoasAfetadasPorEquipes(equipeIds: number[], prismaTx: Prisma.TransactionClient) {
    if (equipeIds.length === 0) return;

    const participantes = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
        where: {
            grupo_responsavel_equipe_id: { in: equipeIds },
            removido_em: null,
        },
        select: { pessoa_id: true },
        distinct: ['pessoa_id'],
    });

    for (const p of participantes) {
        await recalculaPessoaPdmTipos(p.pessoa_id, prismaTx);
    }
}
