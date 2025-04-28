export function normalizadorDeSlot(caminho: string): string {
  if (caminho.includes('.')) {
    return caminho.replace(/\./, '__');
  }

  return caminho;
}

export default {
  normalizadorDeSlot,
};
