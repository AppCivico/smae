function obterParametroNoObjeto(caminho: string, objeto: any) {
  if (!caminho.includes('.')) {
    if (!objeto) {
      return objeto;
    }

    if (objeto[caminho] === undefined) {
      // eslint-disable-next-line no-console
      console.warn(
        `Item "${caminho}" não encontrado no objeto`,
      );
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
      // eslint-disable-next-line no-console
      console.warn(
        `Item "${itemCaminho}" não encontrado no caminho "${caminho}"`,
      );

      return amount;
    }

    return amount[itemCaminho];
  }, objeto);

  return saida;
}

export default obterParametroNoObjeto;
