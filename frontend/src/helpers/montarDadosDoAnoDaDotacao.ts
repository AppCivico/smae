import deduplicarPorChave from './deduplicarPorChave';

type Segmento = {
  codigo: string;
  descricao: string;
  cod_orgao?: string;
};

type SegmentosDoAno = {
  atualizado_em?: string;
  orgaos?: Segmento[];
  unidades?: Segmento[];
  funcoes?: Segmento[];
  subfuncoes?: Segmento[];
  programas?: Segmento[];
  projetos_atividades?: Segmento[];
  fonte_recursos?: Segmento[];
} | null | undefined;

type ValoresSelecionados = {
  orgao: string;
  unidade: string;
  funcao: string;
  subFuncao: string;
  programa: string;
  projetoAtividade: string;
  fonte: string;
};

const codigoComDescricao = (list: Segmento[] | undefined, codigo: string): string => {
  // eslint-disable-next-line eqeqeq
  const item = list?.find((x) => x.codigo == codigo);
  return item ? `${item.codigo} - ${item.descricao}` : '';
};

export default (s: SegmentosDoAno, valores: ValoresSelecionados) => {
  const orgaosDiponiveis = deduplicarPorChave(s?.orgaos, 'codigo');
  const unidadesDisponiveis = deduplicarPorChave(
    // eslint-disable-next-line eqeqeq
    s?.unidades?.filter((x) => x.cod_orgao == valores.orgao),
    (x) => `${x.cod_orgao}/${x.codigo}`,
  );

  return {
    atualizado_em: s?.atualizado_em,
    orgaosDiponiveis,
    unidadesDisponiveis,
    funcoesDisponiveis: s?.funcoes ?? [],
    subFuncoesDisponiveis: s?.subfuncoes ?? [],
    programasDisponiveis: s?.programas ?? [],
    projetosAtividadesDisponiveis: s?.projetos_atividades ?? [],
    fontesDisponiveis: s?.fonte_recursos ?? [],
    orgao: codigoComDescricao(orgaosDiponiveis, valores.orgao),
    unidade: codigoComDescricao(unidadesDisponiveis, valores.unidade),
    funcao: codigoComDescricao(s?.funcoes, valores.funcao),
    subFuncao: codigoComDescricao(s?.subfuncoes, valores.subFuncao),
    programa: codigoComDescricao(s?.programas, valores.programa),
    projetoAtividade: codigoComDescricao(s?.projetos_atividades, valores.projetoAtividade?.replace('.', '')),
    fonte: codigoComDescricao(s?.fonte_recursos, valores.fonte),
  };
};
