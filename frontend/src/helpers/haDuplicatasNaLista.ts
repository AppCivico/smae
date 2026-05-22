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

function computarMarcador(item: unknown, apenas: Chave[] | null, exceto: Chave[] | null): unknown {
  if (apenas !== null) {
    if (typeof item === 'object' && item !== null) {
      const valores: Record<string, unknown> = {};

      apenas.forEach((propriedade) => {
        if (propriedade !== undefined && propriedade !== null) {
          valores[String(propriedade)] = (item as Record<string, unknown>)[propriedade];
        }
      });

      return apenas.length === 1 && apenas[0] !== undefined && apenas[0] !== null
        ? valores[apenas[0]]
        : JSON.stringify(valores);
    }

    return undefined;
  }

  if (exceto !== null) {
    if (typeof item === 'object' && item !== null) {
      const valores: Record<string, unknown> = { ...item };

      exceto.forEach((propriedade) => {
        if (propriedade !== undefined && propriedade !== null) {
          delete valores[propriedade];
        }
      });

      return Object.keys(valores).length === 1
        ? valores[Object.keys(valores)[0]]
        : JSON.stringify(valores);
    }

    return item;
  }

  return typeof item === 'object' && item !== null ? JSON.stringify(item) : item;
}

export default function indicesDuplicatasNaLista(lista: unknown[], params: Params = {}): number[] {
  if (params.apenas !== undefined && params.exceto !== undefined) {
    throw new Error(`Parâmetros conflitantes fornecidos: ${JSON.stringify(params)}`);
  }

  if (!Array.isArray(lista) || !lista.length) return [];

  let apenas: Chave[] | null = null;
  if (parametroEhValido(params.apenas)) {
    apenas = Array.isArray(params.apenas) ? params.apenas : [params.apenas as Chave];
  }

  let exceto: Chave[] | null = null;
  if (parametroEhValido(params.exceto)) {
    exceto = Array.isArray(params.exceto) ? params.exceto : [params.exceto as Chave];
  }

  const grupos = new Map<unknown, number[]>();

  lista.forEach((item, i) => {
    const marcador = computarMarcador(item, apenas, exceto);
    const grupo = grupos.get(marcador);
    if (grupo) {
      grupo.push(i);
    } else {
      grupos.set(marcador, [i]);
    }
  });

  const indices: number[] = [];
  grupos.forEach((grupo) => {
    if (grupo.length > 1) {
      indices.push(...grupo);
    }
  });

  return indices.sort((a, b) => a - b);
}
