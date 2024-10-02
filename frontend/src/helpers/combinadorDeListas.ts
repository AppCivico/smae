/**
 * Combina os valores de um array de objetos baseado em uma propriedade,
 * separando-os com o separador escolhido.
 *
 * @param {Array<object | string | number>} array - O array de objetos,
 * strings ou números a serem combinados.
 *
 * @param {string} [separadorFornecido=', '] - O separador usado para juntar os valores.
 * Se não for fornecido ou não for uma string, o padrão será ', '.
 *
 * @param {keyof object} [propriedade] - A propriedade dos objetos a ser
 * extraída e combinada (opcional).
 *
 * @returns {string} A string combinada dos valores, separada pelo separador fornecido.
 *
 * @throws {Error} Se o argumento `array` não for um array,
 * exibe um erro no console e retorna uma string vazia.
 */
import { join } from 'lodash';

export default function combinadorDeListas(
  array: Array<object | string | number>,
  separadorFornecido?: string,
  propriedade?: string,
): string {
  const separador = (!separadorFornecido || typeof separadorFornecido !== 'string')
    ? ', '
    : separadorFornecido;

  // Se não for um array retorna uma string vazia pra não quebrar tudo
  // mas exibe um erro no console
  if (!Array.isArray(array)) {
    console.error('O argumento deve ser um array');
    return '';
  }

  // Se for um array de objetos, combina os valores das propriedades
  if (propriedade) {
    return join(array.map((obj) => obj[propriedade as keyof object]), separador);
  }

  // Se não apenas combina os items do array usando o separador
  return join(array, separador);
}
