/**
 * Gera uma lista de anos de um ano inicial até o ano atual
 * @param anoInicial - Ano inicial da lista
 * @returns Lista de anos formatada para select
 */
export default function gerarListaAnos(anoInicial = 2022): Array<{ id: string; label: string }> {
  const anoAtual = new Date().getFullYear();
  const anos: Array<{ id: string; label: string }> = [];

  for (let ano = anoAtual; ano >= anoInicial; ano -= 1) {
    anos.push({
      id: String(ano),
      label: String(ano),
    });
  }

  return anos;
}
