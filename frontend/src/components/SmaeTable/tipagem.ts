export type Coluna = {
  chave: string;
  label?: string;
  ehCabecalho?: boolean;
  ehDadoComputado?: boolean;
  atributosDaCelula?: Record<string, unknown>;
  atributosDaColuna?: Record<string, unknown>;
  atributosDoCabecalhoDeColuna?: Record<string, unknown>;
  atributosDoRodapeDeColuna?: Record<string, unknown>;
  classe?: string | string[] | Record<string, unknown>;
  formatador?: (args: unknown) => number | string;
};
export type Colunas = Coluna[];

export type Linha = { [key: string]: string | number | unknown };
export type Linhas = Linha[];
