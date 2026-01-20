import gerarDiretoriosDeUmCaminho from './gerarDiretoriosDeUmCaminho';

const deduplicarCaminhos = (caminhos) => Array.from(new Set(caminhos));

// tornar ID dos diretorios um parâmetro HTML amigável
const normalizarId = (caminho) => caminho.replace(/\//g, '_barra_').replace(/\./g, '_ponto_');

const definirPai = (caminho) => {
  if (caminho === '/' || !caminho.length) {
    return null;
  }

  const posicaoUltimaBarra = caminho.lastIndexOf('/', caminho.length - 2);

  return posicaoUltimaBarra >= 0
    ? normalizarId(caminho.slice(0, posicaoUltimaBarra + 1))
    : null;
};

const definirNome = (caminho) => {
  if (caminho === '/') {
    return '/';
  }
  if (!caminho.length) {
    return '.';
  }

  const caminhoSemBarraFinal = caminho.replace(/\/$/, '');
  const posicaoUltimaBarra = caminhoSemBarraFinal.lastIndexOf('/');

  return caminhoSemBarraFinal.slice(posicaoUltimaBarra + 1);
};

export default ((caminhos = []) => {
  const caminhosUnicos = deduplicarCaminhos(caminhos);

  // novas duplicatas podem surgir ao gerar os diretórios a partir dos caminhos
  const diretoriosConsolidados = deduplicarCaminhos(
    // retorna os caminhos já normalizados
    caminhosUnicos.flatMap((caminho) => gerarDiretoriosDeUmCaminho(caminho)),
  );

  return diretoriosConsolidados
    .sort((a, b) => a.localeCompare(b))
    .map((caminho) => ({
      id: normalizarId(caminho),
      caminho,
      pai: definirPai(caminho),
      nome: definirNome(caminho),
    }));
});
