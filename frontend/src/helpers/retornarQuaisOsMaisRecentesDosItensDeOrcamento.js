import toFloat from '@/helpers/toFloat';

export default (itens = []) => itens.reduce((acc, cur) => (acc.mês > cur.mês
  ? acc
  : {
    mês: Number(cur.mes),

    percentualEmpenho: cur.percentual_empenho !== undefined
      && cur.percentual_empenho !== null
      ? toFloat(cur.percentual_empenho)
      : null,
    empenho: cur.valor_empenho !== undefined
      && cur.valor_empenho !== null
      ? toFloat(cur.valor_empenho)
      : null,

    percentualLiquidação: cur.percentual_liquidado !== undefined
      && cur.percentual_liquidado !== null
      ? toFloat(cur.percentual_liquidado)
      : null,

    liquidação: cur.valor_liquidado !== undefined
        && cur.valor_liquidado !== null
      ? toFloat(cur.valor_liquidado)
      : null,
  }), {});
