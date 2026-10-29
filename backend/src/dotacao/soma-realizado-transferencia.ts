import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';

export type ChaveRealizadoTransferencia = {
    ano_referencia: number;
    dotacao: string;
    processo: string | null;
    nota_empenho: string | null;
};

// soma de todas as transferências; mesma regra das triggers: dotação sem processo, processo sem nota, ou a nota
export async function SomaRealizadoTransferencias(
    prisma: Prisma.TransactionClient,
    chave: ChaveRealizadoTransferencia
): Promise<{ soma_valor_empenho: Decimal; soma_valor_liquidado: Decimal }> {
    const r = await prisma.orcamentoRealizado.aggregate({
        where: {
            transferencia_id: { not: null },
            transferencia: { removido_em: null },
            removido_em: null,
            ano_referencia: chave.ano_referencia,
            dotacao: chave.dotacao,
            processo: chave.processo,
            nota_empenho: chave.nota_empenho,
        },
        _sum: { soma_valor_empenho: true, soma_valor_liquidado: true },
    });

    return {
        soma_valor_empenho: r._sum.soma_valor_empenho ?? new Decimal(0),
        soma_valor_liquidado: r._sum.soma_valor_liquidado ?? new Decimal(0),
    };
}
