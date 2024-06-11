export default (listaDeArquivos = [], listaDeDiretórios = []) => listaDeArquivos
  .reduce((acc, cur) => {
    const caminho = cur.arquivo.diretorio_caminho || '/';
    return acc.indexOf(caminho) === -1
      ? acc.concat([caminho])
      : acc;
  }, listaDeDiretórios.map((x) => x.caminho))
  .sort((a, b) => a.localeCompare(b));
