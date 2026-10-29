import { Prisma } from '@prisma/client';

/**
 * Recalcula `duracao_real` das tarefas do cronograma a partir de `inicio_real` e `termino_real`.
 *
 * O workflow grava as datas reais direto na tarefa espelhada, sem passar pelo TarefaService,
 * e a trigger do cronograma só recalcula a duração da tarefa pai. Sem isso, a tarefa fica com
 * as duas datas e duração nula, e o cronograma recusa salvá-la depois.
 *
 * Chamar logo depois de gravar as datas, com o mesmo `where` usado na escrita.
 * Sem uma das datas (ou com início depois do término), a duração fica nula.
 */
export async function atualizaDuracaoReal(
    prismaTx: Prisma.TransactionClient,
    where: Prisma.TarefaWhereInput
): Promise<void> {
    const tarefas = await prismaTx.tarefa.findMany({ where, select: { id: true } });
    if (tarefas.length === 0) return;

    const ids = tarefas.map((t) => t.id);

    await prismaTx.$executeRaw`
        WITH calc AS (
            SELECT
                id,
                CASE
                    WHEN inicio_real IS NOT NULL AND termino_real IS NOT NULL AND termino_real >= inicio_real
                    THEN termino_real - inicio_real + 1
                END AS duracao
            FROM tarefa
            WHERE id = ANY(${ids}::int[])
        )
        UPDATE tarefa t
        SET duracao_real = calc.duracao
        FROM calc
        WHERE calc.id = t.id
        AND t.duracao_real IS DISTINCT FROM calc.duracao
    `;
}
