export type Coluna = {
  chave: string;
  label?: string;
  cabecalho?: boolean;
  ehDadoComputado?: boolean;
  classe?: string | string[] | Record<string, unknown>;
  formatador?: (args: unknown) => number | string;
};
export type Colunas = Coluna[];

export type Linha = { [key: string]: string | number | unknown };
export type Linhas = Linha[];
