import { Prisma } from '@prisma/client';

/**
 * Recalcula `duracao_real` das tarefas a partir das datas reais (nula se faltar data ou início > término).
 * O workflow grava as datas direto na tarefa espelhada e a trigger do cronograma só recalcula o pai.
 */
export async function atualizaDuracaoReal(prismaTx: Prisma.TransactionClient, ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    await prismaTx.$executeRaw`
        UPDATE tarefa
        SET duracao_real = CASE WHEN termino_real >= inicio_real THEN termino_real - inicio_real + 1 END
        WHERE id = ANY(${ids}::int[])
        AND duracao_real IS DISTINCT FROM (
            CASE WHEN termino_real >= inicio_real THEN termino_real - inicio_real + 1 END
        )
    `;
}
