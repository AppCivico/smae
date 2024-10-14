import toFloat from './toFloat';

export default (valor, semDecimais = false) => {
  const options = semDecimais
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2 };

  return new Intl.NumberFormat('pt-BR', options).format(Number(toFloat(valor)));
};
