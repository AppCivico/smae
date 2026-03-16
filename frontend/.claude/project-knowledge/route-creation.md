# Criação de Rotas

## Estrutura de Arquivos

Cada módulo tem seu próprio arquivo de rotas em `src/router/`. O arquivo principal `src/router/index.js` importa e registra todos os módulos.

```
src/router/
├── index.js              # router principal
├── helpers/
│   └── tiparPropsDeRota.ts
├── administracao.js
├── configuracoes.js
├── metas.js
└── [outros módulos].js
```

Para criar rotas de um novo módulo, crie `src/router/meu-modulo.js` e registre no `index.js`.

---

## Estrutura Básica de uma Rota

```js
import tiparPropsDeRota from '@/router/helpers/tiparPropsDeRota';

{
  path: '/meu-modulo',
  component: MeuModuloRaiz,
  name: 'meuModuloRaiz',
  meta: {
    título: 'Meu Módulo',
    entidadeMãe: 'pdm',         // contexto do módulo
    limitarÀsPermissões: ['Modulo.permissao'],
    íconeParaMenu: `<svg>...</svg>`,
    rotasParaMenuPrincipal: ['entidadeMae.meuModulo.listar'],
  },
  children: [
    {
      name: 'entidadeMae.meuModulo.listar',
      path: '',
      component: MeuModuloLista,
      meta: { título: 'Meu Módulo' },
    },
    {
      name: 'entidadeMae.meuModulo.criar',
      path: 'novo',
      component: MeuModuloCriarEditar,
      meta: {
        título: 'Novo item',
        rotaDeEscape: 'entidadeMae.meuModulo.listar',
        rotasParaMigalhasDePão: ['entidadeMae.meuModulo.listar'],
      },
    },
    {
      path: ':itemId',
      name: 'entidadeMae.meuModulo.editar',
      component: MeuModuloCriarEditar,
      props: tiparPropsDeRota,
      meta: {
        título: 'Editar item',
        rotaDeEscape: 'entidadeMae.meuModulo.listar',
        rotasParaMigalhasDePão: ['entidadeMae.meuModulo.listar'],
      },
    },
  ],
}
```

---

## Props de Rota

### `tiparPropsDeRota` — uso padrão

Sempre que os parâmetros da rota precisam ser passados como props para o componente, use `tiparPropsDeRota`:

```js
import tiparPropsDeRota from '@/router/helpers/tiparPropsDeRota';

{
  path: 'demandas/:id',
  name: 'demandaDetalhe',
  component: DemandaDetalhe,
  props: tiparPropsDeRota,
}
```

A função converte automaticamente os parâmetros para os tipos corretos (string, boolean, number) e decodifica primitivas.

### Props estáticas

```js
props: { type: 'novo', parentPage: 'metas' },
```

### Props de query e params juntos

```js
props: ({ params, query }) => ({
  ...params,
  ...query,
  opcao: Number(query.opcao),
}),
```

---

## Campos `meta` Comuns

| Campo | Tipo | Descrição |
|---|---|---|
| `título` | `string \| Function` | Título da página. Pode ser uma função que lê de uma store Pinia |
| `limitarÀsPermissões` | `string[]` | Permissões necessárias para acessar a rota |
| `entidadeMãe` | `string` | Contexto do módulo: `'pdm'`, `'projeto'`, `'mdo'`, `'planoSetorial'` |
| `rotaDeEscape` | `string` | Nome da rota para onde ir ao cancelar/voltar |
| `rotasParaMigalhasDePão` | `string[]` | Nomes de rotas que formam o breadcrumb |
| `rotasParaMenuPrincipal` | `string[]` | Nomes de rotas exibidas no menu lateral principal |
| `rotasParaMenuSecundário` | `string[] \| Function` | Nomes de rotas exibidas no menu secundário |
| `íconeParaMenu` | `string` | SVG inline para exibir no menu |
| `tituloParaMigalhaDePao` | `string \| Function` | Texto customizado para o breadcrumb (se diferente de `título`) |
| `rotaPrescindeDeChave` | `boolean` | A rota não exige uma entidade selecionada (ex: lista raiz) |
| `publico` | `boolean` | Acessível sem autenticação |

### Título dinâmico com Pinia

```js
meta: {
  título: () => {
    const meta = useCiclosStore()?.SingleMeta?.meta;
    return meta?.código && meta?.titulo
      ? `Meta ${meta.código} ${meta.titulo}`
      : 'Meta';
  },
}
```

---

## Importação de Componentes

### Lazy loading (padrão para views)

```js
component: () => import('@/views/meu-modulo/MeuModuloLista.vue'),
```

### Eager loading (views pequenas ou muito usadas)

```js
import MeuModuloRaiz from '@/views/meu-modulo/MeuModuloRaiz.vue';
// ...
component: MeuModuloRaiz,
```

### Com loading component

```js
import { defineAsyncComponent } from 'vue';
import LoadingComponent from '@/components/LoadingComponent.vue';

const MeuModuloLista = defineAsyncComponent({
  loader: () => import('@/views/meu-modulo/MeuModuloLista.vue'),
  loadingComponent: LoadingComponent,
});
```

---

## Registrando o Módulo no Router Principal

Em `src/router/index.js`, importe e adicione à lista de rotas:

```js
// import direto (objeto único)
import meuModulo from './meu-modulo.js';

// ou spread (array de rotas)
import * as meuModulo from './meu-modulo.js';

const routes = [
  // ...outras rotas
  meuModulo,          // import direto
  ...meuModulo,       // spread
];
```

---

## Rota Pública (sem autenticação)

```js
{
  path: '/publico',
  component: PublicLayout,
  meta: { publico: true },
  children: [
    {
      path: 'item/:id',
      name: 'itemPublico',
      component: ItemPublicoDetalhe,
      props: tiparPropsDeRota,
      meta: { título: 'Detalhe do Item' },
    },
  ],
}
```

---

## Redirect

```js
{
  path: '/modulo',
  redirect: { name: 'moduloListar' },
  children: [...]
}
```

---

## Convenções de Nomenclatura

- Nomes de rotas: dot notation seguindo o padrão `módulo.entidade.ação` → `portfolio.listar`, `portfolio.criar`, `portfolio.editar` (código legado usa flat camelCase como `portfolioListar` — não replicar em código novo)
- Paths: kebab-case → `/meu-modulo/novo`
- Params de ID: sempre `nomeEntidadeId` → `:portfolioId`, `:metaId`