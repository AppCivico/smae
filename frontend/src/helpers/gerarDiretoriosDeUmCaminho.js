import normalizarCaminho from './normalizarCaminho.ts';

export default (caminho = '') => {
  if (!caminho || caminho === './') {
    return [''];
  }

  // remover barra final para simplificar o `for()`
  const caminhoNormalizado = normalizarCaminho(caminho).replace(/\/$/, '');

  const caminhos = [];
  const segmentos = caminhoNormalizado.split('/');

  for (let index = 0, { length } = segmentos; index < length; index += 1) {
    const diretorioAnterior = caminhos[index - 1] ?? '';

    const caminhoAtual = !diretorioAnterior
      ? `${segmentos[index]}/`
      : `${diretorioAnterior}${segmentos[index]}/`;

    caminhos.push(caminhoAtual);
  }

  return caminhos;
};
