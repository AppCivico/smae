function obterParametroNoObjeto(caminho: string, objeto: Record<string, unknown>) {
  if (!caminho.includes('.')) {
    if (!objeto) {
      return objeto;
    }

    if (objeto[caminho] === undefined) {
      if (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`Item "${caminho}" não encontrado no objeto`, objeto);
      }

      return objeto;
    }

    return objeto[caminho];
  }

  const caminhoEmPassos = caminho.split('.');

  const saida = caminhoEmPassos.reduce<any>((amount, itemCaminho) => {
    if (!amount) {
      return amount;
    }

    if (amount[itemCaminho] === undefined) {
      if (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          `Item "${itemCaminho}" não encontrado no caminho "${caminho}"`,
        );
      }

      return amount;
    }

    return amount[itemCaminho];
  }, objeto);

  return saida;
}

export default obterParametroNoObjeto;
