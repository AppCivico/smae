enum CicloFase {
  Orcamento, // nao sei
  Analise,
  Risco,
  Fechamento,
  Cronograma, // nao sei
  Coleta, // nao sei
}
export type ChavesFase = keyof typeof CicloFase;

const mapaDeFases: Record<ChavesFase, { icone: string; label: string }> = {
  Coleta: {
    icone: 'i_calendar', // nao sei
    label: 'Cronograma', // nao sei
  },
  Cronograma: {
    icone: 'i_calendar', // nao sei
    label: 'Cronograma', // nao sei
  },
  Orcamento: {
    icone: 'i_$', // nao sei
    label: 'Orçamento', // nao sei
  },
  Analise: {
    icone: 'i_iniciativa',
    label: 'Analise Qualitativa',
  },
  Risco: {
    icone: 'i_binoculars',
    label: 'Risco',
  },
  Fechamento: {
    icone: 'i_check',
    label: 'Fechamento',
  },
} as const;

const mapaDeStatus = {
  pendente: '#FF0000',
  atualizado: '#8EC122',
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
