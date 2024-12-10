type Chave = string | number;

type Params = {
  apenas?: Chave | Chave[];
  exceto?: Chave | Chave[];
};

function parametroEhValido(parametro: unknown): boolean {
  return typeof parametro === 'number'
    || (
      (typeof parametro === 'string' || Array.isArray(parametro))
      && !!parametro.length
    );
}

export default (lista: unknown[], params:Params = {}): boolean => {
  if (params.apenas !== undefined && params.exceto !== undefined) {
    throw new Error(`Parâmetros conflitantes fornecidos: ${JSON.stringify(params)}`);
  }

  if (!Array.isArray(lista) || !lista.length) return false;

  const itensAnteriores = new Set();

  if (parametroEhValido(params.apenas)) {
    const apenas = Array.isArray(params.apenas)
      ? params.apenas
      : [params.apenas];

    return lista.some((item:unknown) => {
      let marcador;

      if (typeof item === 'object' && item !== null) {
        const valores: Record<string, unknown> = {};

        apenas.forEach((propriedade) => {
          if (propriedade !== undefined && propriedade !== null) {
            valores[String(propriedade)] = (item as Record<string, unknown>)[propriedade];
          }
        });

        marcador = apenas.length === 1
        && apenas[0] !== undefined
        && apenas[0] !== null
          ? valores[apenas[0]]
          : JSON.stringify(valores);
      } else {
        marcador = undefined;
      }

      if (itensAnteriores.has(marcador)) {
        return true;
      }

      itensAnteriores.add(marcador);

      return false;
    });
  }

  if (parametroEhValido(params.exceto)) {
    const exceto = Array.isArray(params.exceto)
      ? params.exceto
      : [params.exceto];

    return lista.some((item:unknown) => {
      let marcador;

      if (typeof item === 'object' && item !== null) {
        const valores: Record<string, unknown> = { ...item };

        exceto.forEach((propriedade) => {
          if (propriedade !== undefined && propriedade !== null) {
            delete (valores as Record<string, unknown>)[propriedade];
          }
        });

        marcador = Object.keys(valores).length === 1
          ? valores[Object.keys(valores)[0]]
          : JSON.stringify(valores);
      } else {
        marcador = item;
      }

      if (itensAnteriores.has(marcador)) {
        return true;
      }

      itensAnteriores.add(marcador);

      return false;
    });
  }

  return lista.some((item:unknown) => {
    const marcador = typeof item === 'object' && item !== null
      ? JSON.stringify(item)
      : item;

    if (itensAnteriores.has(marcador)) {
      return true;
    }

    itensAnteriores.add(marcador);

    return false;
  });
};
