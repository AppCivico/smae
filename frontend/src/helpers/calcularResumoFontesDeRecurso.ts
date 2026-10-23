import Big from 'big.js';

type ValorInformado = number | string | null | undefined;

export type ResumoFontesDeRecurso = {
  percentuais: (number | null)[];
  totalInformado: number;
  percentualInformado: number | null;
  semInformacao: number | null;
  percentualSemInformacao: number | null;
  total: number;
  excedente: boolean;
};

function paraBig(valor: ValorInformado): Big | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? new Big(numero) : null;
}

function percentual(parte: Big, todo: Big): number {
  return parte.times(100).div(todo).round(2).toNumber();
}

/**
 * Consolida as fontes de recurso de um projeto/obra em relação ao custo total
 * planejado do cronograma. Sem custo planejado, não há como calcular
 * percentuais nem saldo.
 */
export default function calcularResumoFontesDeRecurso(
  valores: ValorInformado[],
  custoTotalPlanejado: ValorInformado,
): ResumoFontesDeRecurso {
  const custoInformado = paraBig(custoTotalPlanejado);
  const custo = custoInformado?.gt(0) ? custoInformado : null;

  const valoresConvertidos = valores.map(paraBig);
  const totalInformado = valoresConvertidos
    .reduce((soma: Big, valor) => (valor ? soma.plus(valor) : soma), new Big(0));

  if (!custo) {
    return {
      percentuais: valoresConvertidos.map(() => null),
      totalInformado: totalInformado.toNumber(),
      percentualInformado: null,
      semInformacao: null,
      percentualSemInformacao: null,
      total: totalInformado.toNumber(),
      excedente: false,
    };
  }

  const semInformacao = custo.minus(totalInformado);

  return {
    percentuais: valoresConvertidos.map((valor) => (valor ? percentual(valor, custo) : null)),
    totalInformado: totalInformado.toNumber(),
    percentualInformado: percentual(totalInformado, custo),
    semInformacao: semInformacao.toNumber(),
    percentualSemInformacao: percentual(semInformacao, custo),
    total: totalInformado.plus(semInformacao).toNumber(),
    excedente: totalInformado.gt(custo),
  };
}
