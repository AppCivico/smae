import { Decimal } from 'decimal.js';

export const PAINEL_TOP_N = 5;

// Percentual com 2 casas; denominador zero (ou ausente) devolve 0 em vez de NaN/Infinity.
export function calcPct(parte: Decimal, total: Decimal): number {
    if (total.isZero()) return 0;
    return parte.div(total).times(100).toDecimalPlaces(2).toNumber();
}

export type LinhaAgrupavel<T> = { item: T | null; rotulo: string; valor: Decimal };
export type LinhaAgrupada<T> = LinhaAgrupavel<T> & { outros: boolean };

// Mantém as `n` maiores linhas por valor e soma o restante numa linha "Outros" (item nulo).
// Não mexe na entrada; empates mantêm a ordem original.
export function agruparTopN<T>(linhas: LinhaAgrupavel<T>[], n: number): LinhaAgrupada<T>[] {
    const ordenadas = linhas
        .map((linha, idx) => ({ linha, idx }))
        .sort((a, b) => b.linha.valor.comparedTo(a.linha.valor) || a.idx - b.idx)
        .map((e) => e.linha);

    const top: LinhaAgrupada<T>[] = ordenadas.slice(0, n).map((l) => ({ ...l, outros: false }));
    const resto = ordenadas.slice(n);

    if (resto.length) {
        top.push({
            item: null,
            rotulo: 'Outros',
            valor: resto.reduce((acc, curr) => acc.plus(curr.valor), new Decimal(0)),
            outros: true,
        });
    }

    return top;
}

type AndamentoFase = {
    workflow_fase_id: number;
    workflow_situacao: { situacao: string } | null;
};

// Mesma regra de TransferenciaService.findAllTransferencia: situação do andamento da fase atual.
export function calcFaseStatus(faseAtual: { id: number } | null, andamento: AndamentoFase[]): string | null {
    if (!faseAtual) return null;

    return andamento.find((e) => e.workflow_fase_id == faseAtual.id)?.workflow_situacao?.situacao ?? null;
}

// Quanto do valor da distribuição vem do parlamentar (ex.: 100 mil de 500 mil = 20).
export function calcPctParlamentarDistribuicao(valorParlamentar: Decimal, valorDistribuicao: Decimal): number {
    return calcPct(valorParlamentar, valorDistribuicao);
}

/** Distribuições do órgão escolhido primeiro; as demais mantêm a ordem original (sort estável). */
export function ordenaDistribuicoesPorOrgao<T extends { orgao: { id: number } }>(
    distribuicoes: T[],
    orgaoId: number | null
): T[] {
    if (!orgaoId) return distribuicoes;
    return [...distribuicoes].sort((a, b) => Number(b.orgao.id === orgaoId) - Number(a.orgao.id === orgaoId));
}
