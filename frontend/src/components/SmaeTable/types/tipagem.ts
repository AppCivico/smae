export type Coluna = {
  chave: string;
  label: string;
  cabecalho?: boolean;
  classe?: any;
};
export type Colunas = Coluna[];

export type Linha = { [key: string]: string | number | unknown };
export type Linhas = Linha[];
