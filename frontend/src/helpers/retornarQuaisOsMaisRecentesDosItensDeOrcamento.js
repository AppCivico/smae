import toFloat from '@/helpers/toFloat';

export default (itens = []) => {
  const itensComValoresConvertidosEmNúmeros = itens.map((x) => ({
    ...x,
    valor_empenho: x.valor_empenho !== null && typeof x.valor_empenho !== 'undefined'
      ? toFloat(x.valor_empenho) : null,
    valor_liquidado: x.valor_liquidado !== null && typeof x.valor_liquidado !== 'undefined'
      ? toFloat(x.valor_liquidado) : null,
  }));

  return {
    empenho: itensComValoresConvertidosEmNúmeros
      .filter((x) => x.valor_empenho !== null)
      .sort((a, b) => b.mes - a.mes)?.[0]?.valor_empenho || 0,
    liquidação: itensComValoresConvertidosEmNúmeros
      .filter((x) => x.valor_liquidado !== null)
      .sort((a, b) => b.mes - a.mes)?.[0]?.valor_liquidado || 0,
  };
};
