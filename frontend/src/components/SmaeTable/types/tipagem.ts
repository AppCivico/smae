export type Coluna = {
  chave: string;
  label?: string;
  cabecalho?: boolean;
  ehDadoComputado?: boolean;
  classe?: any;
  formatador?: (v: any) => any;
};
export type Colunas = Coluna[];

export type Linha = { [key: string]: string | number | unknown };
export type Linhas = Linha[];
