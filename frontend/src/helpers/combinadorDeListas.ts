import obterPropriedadeNoObjeto from './objetos/obterPropriedadeNoObjeto';

const juntarValores = (
  acumulador: string,
  item: object | string | number | null | undefined,
  separador: string,
): string => (typeof item !== 'string' && typeof item !== 'number'
  ? `${acumulador}${JSON.stringify(item)}${separador}`
  : `${acumulador}${item}${separador}`);

/**
 * Combina os valores de um array de objetos baseado em uma propriedade,
 * separando-os com o separador escolhido.
 *
 * @param {Array<object | string | number>} lista - O array de objetos,
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
 * exibe um erro no console e retorna uma string vazia.
 */
export default function combinadorDeListas(
  lista: Array<object | string | number>,
  separadorFornecido?: string,
  propriedade?: string,
): string {
  // Se o separador não for uma string, exibe um aviso no console
  const e = new Error();
  if (typeof separadorFornecido !== 'string') {
    console.error('O separador deve ser uma string', e.stack);
  }

  // Se a propriedade não for uma string, exibe um aviso no console
  // e retorna uma string vazia para não quebrar o código
  if (propriedade && typeof propriedade !== 'string') {
    console.error('O caminho da propriedade deve ser uma string', e.stack);
    return '';
  }

  // Se não for um array retorna uma string vazia pra não quebrar tudo
  // mas exibe um erro no console
  if (!Array.isArray(lista)) {
    if (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV) {
      console.error('O parâmetro deve ser um array', e.stack);
    }
    return '';
  }

  // Se a lista estiver vazia, retorna um texto vazio
  if (!lista.length) {
    return '';
  }

  const separador = (!separadorFornecido || typeof separadorFornecido !== 'string')
    ? ', '
    : separadorFornecido;

  // Se a propriedade tiver um "." quer dizer que ela está dentro de um objeto,
  // então descemos mais um nível para pegar o valor da propriedade
  if (propriedade) {
    return lista.reduce<string>((acumulador, item) => {
      const valor = obterPropriedadeNoObjeto(propriedade, item as Record<string, unknown>, true);
      return juntarValores(acumulador, valor, separador);
    }, '').slice(0, -separador.length);
  }

  // Se não apenas combina os items do array usando o separador
  return lista.reduce<string>((acumulador, item) => juntarValores(acumulador, item, separador), '')
    .slice(0, -separador.length);
}
