/**
 * Arquivo de tipagem global
 *
 * @link https://bobbyhadz.com/blog/typescript-make-types-global
 * @link https://stackoverflow.com/questions/42984889/global-types-in-typescript
 */

import 'vue-router';

export { };

declare global {
  type ChamadasPendentes = {
    lista: boolean;
    emFoco: boolean;
  };

  type Erros = {
    lista: null | unknown;
    emFoco: null | unknown;
  };

  type Estado = {
    lista: unknown[];
    emFoco: unknown | null;
    chamadasPendentes: ChamadasPendentes;
    erros: Erros;
  };

  type Paginacao = {
    tokenPaginacao: string;
    paginas: number;
    paginaCorrente: number;
    temMais: boolean;
    totalRegistros: number;
  };
}
/**
 * @link https://router.vuejs.org/guide/advanced/meta.html#TypeScript
 */
declare module 'vue-router' {
  interface RouteMeta {
    entidadeMãe?: string;
    título?: string | (() => string);
    títuloParaMenu?: string | (() => string);
    rotaDeAdição?: RouteLocationRaw;
    rotaDeEscape?: RouteLocationRaw;
    rotaDeEdição?: string | string[];
    rotasParaMigalhasDePão?: string[];
    limitarÀsPermissões?: string | string[];
    íconeParaMenu?: string;
    rotasParaMenuSecundário?: string[];
    rotasParaMenuPrincipal?: string[];
  }
}
