/**
 * Arquivo de tipagem global
 *
 * @link https://bobbyhadz.com/blog/typescript-make-types-global
 * @link https://stackoverflow.com/questions/42984889/global-types-in-typescript
 */

declare type ChamadasPendentes = {
  lista: boolean;
  emFoco: boolean;
};

declare type Erros = {
  lista: null | unknown;
  emFoco: null | unknown;
};

declare type Paginacao = {
  tokenPaginacao: string;
  paginas: number;
  paginaCorrente: number;
  temMais: boolean;
  totalRegistros: number;
};
