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
