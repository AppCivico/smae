import toFloat from './toFloat';

/**
 * Formata um valor monetário para uma string com separadores de milhar e decimal.
 * @param {number|string} valor - O valor a ser formatado.
 * @param {Object} [opcoes] - Opções legadas de formatação, acrescidas de
 *   todas as opções do construtor Intl.NumberFormat:
 *   @param {boolean} [opcoes.semDecimais=false] - Se verdadeiro, remove os decimais.
 *   @param {boolean} [opcoes.compactado=false] - Se verdadeiro, usa notação compacta.
 *   @param {string} [opcoes.localidade='pt-BR'] - A localidade para formatação.
 *   @param {string} [opcoes.localeMatcher]
 *   @param {string} [opcoes.style]
 *   @param {string} [opcoes.currency]
 *   @param {string} [opcoes.currencyDisplay]
 *   @param {string} [opcoes.currencySign]
 *   @param {string} [opcoes.unit]
 *   @param {string} [opcoes.unitDisplay]
 *   @param {boolean} [opcoes.signDisplay]
 *   @param {string} [opcoes.notation]
 *   @param {string} [opcoes.compactDisplay]
 *   @param {boolean} [opcoes.useGrouping]
 *   @param {number} [opcoes.minimumIntegerDigits]
 *   @param {number} [opcoes.minimumFractionDigits]
 *   @param {number} [opcoes.maximumFractionDigits]
 *   @param {number} [opcoes.minimumSignificantDigits]
 *   @param {number} [opcoes.maximumSignificantDigits]
 *   @param {number} [opcoes.roundingPriority]
 * @returns {string} O valor formatado como string.
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
 */

export default (valor, {
  semDecimais = false,
  compactado = false,
  localidade = 'pt-BR',
  ...opcoes
} = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'decimal',
}) => {
  const numeroConvertido = parseFloat(valor);
  if (Number.isNaN(numeroConvertido)) {
    return '';
  }

  const options = semDecimais
    ? { ...opcoes, minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, ...opcoes };

  if (options.maximumFractionDigits < options.minimumFractionDigits) {
    options.maximumFractionDigits = options.minimumFractionDigits;
  }

  if (compactado) {
    options.notation = 'compact';
    options.compactDisplay = 'long';
  }

  return new Intl.NumberFormat(localidade, options).format(Number(toFloat(valor)));
};
