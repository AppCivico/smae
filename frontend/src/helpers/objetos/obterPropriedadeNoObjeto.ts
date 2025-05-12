function obterPropriedadeNoObjeto(
  caminho: string,
  objeto: Record<string, unknown>,
  alertarIndefinidos = true,
): string | number | object | undefined {
  if (!caminho.includes('.')) {
    if (!objeto) {
      return objeto;
    }

    if (objeto[caminho] === undefined) {
      if (alertarIndefinidos && (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV)) {
        // eslint-disable-next-line no-console
        console.warn(`Item "${caminho}" não encontrado no objeto`, objeto);
      }

      return objeto;
    }

    return objeto[caminho];
  }

  const caminhoEmPassos = caminho.split('.');

  const saida = caminhoEmPassos.reduce<Record<string, unknown>>((amount, itemCaminho) => {
    if (!amount) {
      return amount;
    }

    if (amount[itemCaminho] === undefined) {
      if (alertarIndefinidos && (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV)) {
        // eslint-disable-next-line no-console
        console.warn(
          `Item "${itemCaminho}" não encontrado no caminho "${caminho}"`,
        );
      }

      return amount;
    }

    return amount[itemCaminho] as Record<string, unknown>;
  }, objeto);

  return saida;
}

export default obterPropriedadeNoObjeto;
