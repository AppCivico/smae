import toFloat from './toFloat';

/**
 * Formata um valor monetário para uma string com separadores de milhar e decimal.
 * @param {number|string} valor - O valor a ser formatado.
 * @param {Object} [opcoes] - Opções de formatação. Aceita as [disponíveis por padrão]
(https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat) acrescidas de:
  * @param {boolean} [opcoes.semDecimais=false] - Se verdadeiro, remove os
  decimais.
 * @param {boolean} [opcoes.compactado=false] - Se verdadeiro, usa notação compacta.
 * @param {string} [opcoes.localidade='pt-BR'] - A localidade para formatação.
 * @returns {string} O valor formatado como string.
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
 */

export default (valor, {
  semDecimais = false,
  compactado = false,
  localidade = 'pt-BR',
  ...opcoes
} = {}) => {
  const numeroConvertido = parseFloat(valor);
  if (Number.isNaN(numeroConvertido)) {
    return '';
  }

  const options = semDecimais
    ? { opcoes, minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { opcoes, minimumFractionDigits: 2 };

  if (compactado) {
    options.notation = 'compact';
    options.compactDisplay = 'long';
  }

  return new Intl.NumberFormat(localidade, options).format(Number(toFloat(valor)));
};
