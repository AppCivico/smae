export type NivelRegionalizacao = {
  id: number;
  nome: string;
};

const niveisRegionalizacao: Record<string, NivelRegionalizacao> = {
  1: {
    id: 1,
    nome: 'Município',
  },
  2: {
    id: 2,
    nome: 'Região',
  },
  3: {
    id: 3,
    nome: 'Subprefeitura',
  },
  4: {
    id: 4,
    nome: 'Distrito',
  },
};

export default niveisRegionalizacao;
