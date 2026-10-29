import { Prisma } from '@prisma/client';

// Todo processo SEI de contrato ativo precisa estar cadastrado em alguma obra vinculada; mesma regra da migration 20261020120000.
export async function garanteCoberturaSeiContratos(
    prismaTx: Prisma.TransactionClient,
    contrato_ids: number[],
    pessoa_id: number,
    projeto_origem_id: number
): Promise<void> {
    if (contrato_ids.length === 0) return;

    const origem = await prismaTx.projeto.findUnique({ where: { id: projeto_origem_id }, select: { nome: true } });
    const origemNome = origem?.nome ?? '';

    await prismaTx.$executeRaw`
        WITH descoberto AS (
            SELECT DISTINCT cs.contrato_id, regexp_replace(cs.numero_sei, '[^0-9]', '', 'g') AS digitos
            FROM contrato_sei cs
            JOIN contrato c ON c.id = cs.contrato_id AND c.removido_em IS NULL
            WHERE cs.contrato_id = ANY(${contrato_ids}::int[])
              AND regexp_replace(cs.numero_sei, '[^0-9]', '', 'g') <> ''
              AND NOT EXISTS (
                  SELECT 1
                  FROM contrato_projeto cp
                  JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
                  JOIN projeto_registro_sei prs ON prs.projeto_id = cp.projeto_id AND prs.removido_em IS NULL
                  WHERE cp.contrato_id = cs.contrato_id
                    AND cp.removido_em IS NULL
                    AND prs.processo_sei = regexp_replace(cs.numero_sei, '[^0-9]', '', 'g')
              )
        )
        UPDATE projeto_registro_sei r
        SET removido_em = NULL, removido_por = NULL, atualizado_em = now(), atualizado_por = ${pessoa_id},
            observacoes = concat_ws(E'\n\n', nullif(r.observacoes, ''), x.obs)
        FROM (
            SELECT max(prs.id) AS id,
                   format('Restaurado automaticamente: processo do contrato %s, que deixou de estar vinculado a "%s".',
                          c.numero, ${origemNome}::text) AS obs
            FROM descoberto d
            JOIN contrato c ON c.id = d.contrato_id
            JOIN contrato_projeto cp ON cp.contrato_id = d.contrato_id AND cp.removido_em IS NULL
            JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
            JOIN projeto_registro_sei prs ON prs.projeto_id = cp.projeto_id
                AND prs.removido_em IS NOT NULL
                AND prs.processo_sei = d.digitos
            GROUP BY d.contrato_id, d.digitos, c.numero
        ) x
        WHERE r.id = x.id`;

    await prismaTx.$executeRaw`
        WITH descoberto AS (
            SELECT DISTINCT cs.contrato_id, regexp_replace(cs.numero_sei, '[^0-9]', '', 'g') AS digitos
            FROM contrato_sei cs
            JOIN contrato c ON c.id = cs.contrato_id AND c.removido_em IS NULL
            WHERE cs.contrato_id = ANY(${contrato_ids}::int[])
              AND regexp_replace(cs.numero_sei, '[^0-9]', '', 'g') <> ''
              AND NOT EXISTS (
                  SELECT 1
                  FROM contrato_projeto cp
                  JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
                  JOIN projeto_registro_sei prs ON prs.projeto_id = cp.projeto_id AND prs.removido_em IS NULL
                  WHERE cp.contrato_id = cs.contrato_id
                    AND cp.removido_em IS NULL
                    AND prs.processo_sei = regexp_replace(cs.numero_sei, '[^0-9]', '', 'g')
              )
        ),
        destino AS (
            SELECT d.digitos, c.numero,
                   coalesce(
                       (SELECT cp.projeto_id
                          FROM contrato_projeto cp
                          JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
                         WHERE cp.contrato_id = d.contrato_id AND cp.removido_em IS NULL
                           AND cp.projeto_id = c.projeto_id_deprecated
                         LIMIT 1),
                       (SELECT cp.projeto_id
                          FROM contrato_projeto cp
                          JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
                         WHERE cp.contrato_id = d.contrato_id AND cp.removido_em IS NULL
                         ORDER BY cp.id
                         LIMIT 1)
                   ) AS projeto_id
            FROM descoberto d
            JOIN contrato c ON c.id = d.contrato_id
        )
        INSERT INTO projeto_registro_sei (projeto_id, categoria, processo_sei, observacoes, criado_em, criado_por)
        SELECT DISTINCT ON (projeto_id, digitos) projeto_id, 'Manual'::"CategoriaProcessoSei", digitos,
               format('Cadastrado automaticamente: processo do contrato %s, que deixou de estar vinculado a "%s".',
                      numero, ${origemNome}::text),
               now(), ${pessoa_id}::int
        FROM destino
        WHERE projeto_id IS NOT NULL
        ORDER BY projeto_id, digitos, numero`;
}
