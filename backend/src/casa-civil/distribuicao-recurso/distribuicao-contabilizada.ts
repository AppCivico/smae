import { Prisma } from '@prisma/client';

export const StatusAtualDistribuicaoSelect = {
    take: 1,
    where: { removido_em: null },
    orderBy: [{ data_troca: 'desc' }, { id: 'desc' }],
    select: {
        status: { select: { valor_distribuicao_contabilizado: true } },
        status_base: { select: { valor_distribuicao_contabilizado: true } },
    },
} satisfies Prisma.DistribuicaoRecurso$statusArgs;

type StatusContabilizado = { valor_distribuicao_contabilizado: boolean } | null;

// Distribuição sem status conta; com status, vale o último não removido.
export function distribuicaoContabilizada(
    status: { status: StatusContabilizado; status_base: StatusContabilizado }[]
): boolean {
    const statusRow = status[0];
    if (!statusRow) return true;

    return !!(statusRow.status ?? statusRow.status_base)?.valor_distribuicao_contabilizado;
}

// Versão SQL de distribuicaoContabilizada(): `drAlias` é o alias da tabela distribuicao_recurso na query.
export const SqlDistribuicaoContabilizada = (drAlias: Prisma.Sql) => Prisma.sql`COALESCE((
    SELECT COALESCE(ds.valor_distribuicao_contabilizado, dsb.valor_distribuicao_contabilizado)
    FROM distribuicao_recurso_status drs
    LEFT JOIN distribuicao_status ds ON ds.id = drs.status_id
    LEFT JOIN distribuicao_status_base dsb ON dsb.id = drs.status_base_id
    WHERE drs.distribuicao_id = ${drAlias}.id AND drs.removido_em IS NULL
    ORDER BY drs.data_troca DESC, drs.id DESC LIMIT 1), true)`;
