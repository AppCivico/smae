import months from '@/consts/months';

export default (itens = []) => (Array.isArray(itens)
  ? months[itens.reduce((acc, cur) => ((acc > cur.mes) ? acc : cur.mes), -Infinity) - 1]
  : undefined);
