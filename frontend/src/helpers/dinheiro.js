import toFloat from './toFloat';

export default (valor, semDecimais = false, compactado = false) => {
  const numeroConvertido = parseFloat(valor);
  if (Number.isNaN(numeroConvertido)) {
    return '';
  }

  const options = semDecimais
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2 };

  if (compactado) {
    options.notation = 'compact';
    options.compactDisplay = 'long';
  }

  return new Intl.NumberFormat('pt-BR', options).format(Number(toFloat(valor)));
};
