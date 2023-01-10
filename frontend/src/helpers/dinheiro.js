import toFloat from './toFloat';

export default (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(toFloat(v)));
