const mapaDeSituacoes = {
  cronograma: 'i_calendar',
  orcamento: 'i_$',
  qualificacao: 'i_iniciativa',
  analise_risco: 'i_binoculars',
  fechamento: 'i_check',
} as const;

const mapaDeStatus = {
  pendente: '#FF0000',
  atualizado: '#8EC122',
} as const;

export type ChavesSituacoes = keyof typeof mapaDeSituacoes;
export type ChavesStatus = keyof typeof mapaDeStatus;

export const listaDeSituacoes = Object.keys(mapaDeSituacoes) as ChavesSituacoes[];
export const listaDeStatus = Object.keys(mapaDeStatus) as ChavesStatus[];

export function obterSituacaoIcone(chave: ChavesSituacoes) {
  if (!mapaDeSituacoes[chave]) {
    throw new Error(
      `Chave "${chave}" não encontado na lista "${Object.keys(
        mapaDeSituacoes,
      )}"`,
    );
  }

  return mapaDeSituacoes[chave];
}

export function obterStatus(chave: ChavesStatus) {
  if (!mapaDeStatus[chave]) {
    throw new Error(
      `Chave "${chave}" não encontado na lista "${Object.keys(
        mapaDeStatus,
      )}"`,
    );
  }

  return mapaDeStatus[chave];
}

export function obterRota(chave: ChavesSituacoes) {
  switch (chave) {
    case 'cronograma':
      return '.cronogramaDaMeta';
    case 'orcamento':
      return '.orcamentoDeMetas';
    case 'qualificacao':
    case 'analise_risco':
    case 'fechamento':
      return '.monitoramentoDeMetas';
    default:
      throw new Error(`Chave "${chave}" não encontada parra rotas`);
  }
}
