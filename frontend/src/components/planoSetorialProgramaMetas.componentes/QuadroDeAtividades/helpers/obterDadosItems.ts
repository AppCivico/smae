enum CicloFase {
  Orcamento,
  Cronograma,
}
export type ChavesFase = keyof typeof CicloFase;

const mapaDeFases: Record<ChavesFase, { icone: string; label: string }> = {
  Cronograma: {
    icone: 'i_calendar',
    label: 'Cronograma',
  },
  Orcamento: {
    icone: 'i_$',
    label: 'Orçamento',
  },
} as const;

const mapaDeStatus = {
  pendente: 'var(--vermelho)',
  atualizado: 'var(--verde)',
} as const;
type ChavesStatus = keyof typeof mapaDeStatus;

export type ChavesSituacoes = keyof typeof mapaDeFases;

export const listaDeFases = Object.keys(mapaDeFases) as ChavesFase[];
export const listaDeStatus = Object.keys(mapaDeStatus) as ChavesStatus[];

export function obterFaseLegenda(chave: ChavesSituacoes) {
  if (!mapaDeFases[chave]) {
    throw new Error(
      `Chave "${chave}" não encontado na lista "${Object.keys(
        mapaDeFases,
      )}"`,
    );
  }

  return mapaDeFases[chave].label;
}

export function obterFaseIcone(chave: ChavesSituacoes) {
  if (!mapaDeFases[chave]) {
    throw new Error(
      `Chave "${chave}" não encontado na lista "${Object.keys(
        mapaDeFases,
      )}"`,
    );
  }

  return mapaDeFases[chave].icone;
}

export function obterFaseStatus(preenchido: boolean) {
  if (preenchido) {
    return mapaDeStatus.atualizado;
  }

  return mapaDeStatus.pendente;
}
