function obterPropriedadeNoObjeto(
  caminho: string,
  objeto: Record<string, unknown>,
  ignorarAlertas = false,
): string | number | object | undefined | null {
  if (!caminho.includes('.')) {
    if (!objeto) {
      return objeto;
    }

    if (objeto[caminho] === undefined) {
      if (!ignorarAlertas && (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV)) {
        // eslint-disable-next-line no-console
        console.warn(`Propriedade "${caminho}" não encontrada em:`, objeto);
      }

      return undefined;
    }

    return objeto[caminho];
  }

  const caminhoEmPassos = caminho.split('.');

  let saida: Record<string, unknown> | undefined = objeto;

  for (let i = 0, { length } = caminhoEmPassos; i < length; i += 1) {
    const itemCaminho = caminhoEmPassos[i];

    if (!saida || saida[itemCaminho] === undefined) {
      if (!ignorarAlertas && (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV)) {
        // eslint-disable-next-line no-console
        console.warn(`Propriedade "${itemCaminho}" não encontrada em:`, saida);
      }

      break;
    }

    saida = saida[itemCaminho] as Record<string, unknown>;
  }

  return saida;
}

export default obterPropriedadeNoObjeto;
