export default (caminho: string): string => {
  if (caminho.includes('.')) {
    return caminho.replace(/\./, '__');
  }

  return caminho;
};
