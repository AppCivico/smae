# Criação de Listas no Frontend SMAE

## 1. Visão Geral

Páginas de lista seguem um padrão altamente consistente:

- **Dados**: Pinia stores (`buscarTudo`, `excluirItem`)
- **Renderização**: Componente `SmaeTable` (substitui `<table class="tablemain">` manual)
- **Cabeçalho**: Componente `CabecalhoDePagina`
- **Filtros**: Componente `FiltroParaPagina` (filtros com URL) ou `LocalFilter` (busca simples)
- **Loading**: Componente `LoadingComponent`
- **Estados vazio/erro**: Tratados automaticamente pelo `SmaeTable`

---

## 2. Perguntas Obrigatórias Antes de Implementar

Antes de criar uma lista, pergunte ao usuário:

1. **A listagem tem filtros?** Se sim: quais campos? Os filtros devem persistir na URL?
   - Com persistência na URL → `FiltroParaPagina`
   - Busca simples client-side → `LocalFilter` (ou `filtrarObjetos` com `route.query`)

2. **A listagem tem paginação?** Se sim, usar `MenuPaginacao`. Ver seção [MenuPaginacao](#8-menupaginacao).

---

## 4. Convenção de Arquivos e Nomes

```
src/views/<dominio>/
  <Entidade>Lista.vue          # Página de listagem
  <Entidade>Raiz.vue           # Layout raiz (nested routes)
  <Entidade>CriarEditar.vue    # Formulário criar/editar
```

---

## 5. Template Mínimo de Lista (padrão atual)

```vue
<script setup>
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

import CabecalhoDePagina from "@/components/CabecalhoDePagina.vue";
import SmaeTable from "@/components/SmaeTable/SmaeTable.vue";
import { useAlertStore } from "@/stores/alert.store";
import { useMinhaEntidadeStore } from "@/stores/minhaEntidade.store";

const alertStore = useAlertStore();
const store = useMinhaEntidadeStore();
const { lista } = storeToRefs(store);

async function excluirItem(linha) {
  await store.excluirItem(linha.id);
  store.$reset();
  store.buscarTudo();
}

onMounted(() => {
  store.$reset();
  store.buscarTudo();
});
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink :to="{ name: 'minhaEntidade.criar' }" class="btn big">
        Novo item
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <SmaeTable
    :dados="lista"
    :colunas="[
      { chave: 'campo1', label: 'Campo 1' },
      { chave: 'campo2', label: 'Campo 2' },
    ]"
    :rota-editar="
      ({ id }) => ({ name: 'minhaEntidade.editar', params: { entidadeId: id } })
    "
    parametro-no-objeto-para-excluir="descricao"
    @deletar="excluirItem"
  />
</template>
```

---

## 5.1 Watch para Filtros e Paginação

Se a lista tiver **filtros via URL** (`FiltroParaPagina` ou `route.query`), adicionar um `watch` que recarrega os dados quando os query params mudam:

```javascript
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// Recarrega quando qualquer filtro muda
watch(
  () => [
    route.query.campo1,
    route.query.campo2,
  ],
  () => {
    store.$reset();
    store.buscarTudo(route.query);
  },
);
```

Se tiver **paginação via `MenuPaginacao`**, usar `watchEffect` em vez de `watch` — ele rastreia automaticamente todos os `route.query` acessados dentro de `buscarTudo`:

```javascript
import { watchEffect } from "vue";

// Rebusca ao mudar qualquer query param (filtros + pagina + token_paginacao)
watchEffect(() => {
  store.buscarTudo(route.query);
});
```

> **Regra:** filtros sem paginação → `watch` com array de campos explícitos. Com `MenuPaginacao` → `watchEffect` (rastreia tudo automaticamente). Nunca misturar os dois para o mesmo `buscarTudo`.

---

## 6. SmaeTable

**Caminho:** `@/components/SmaeTable/SmaeTable.vue`

Ver documentação completa em [src/components/SmaeTable/README.md](../../src/components/SmaeTable/README.md).

---

## 7. CabecalhoDePagina

**Caminho:** `@/components/CabecalhoDePagina.vue`

Substitui o `<header class="flex spacebetween center mb2">` manual. Lê o título de `route.meta.título` automaticamente.

```vue
<CabecalhoDePagina>
  <template #acoes>
    <SmaeLink :to="{ name: 'entidade.criar' }" class="btn big">
      Novo item
    </SmaeLink>
  </template>
</CabecalhoDePagina>
```

Slots disponíveis: `#titulo`, `#subtitulo`, `#acoes`.

---

## 8. MenuPaginacao

**Caminho:** `@/components/MenuPaginacao.vue`

Ver documentação completa em [src/components/MenuPaginacao.md](../../src/components/MenuPaginacao.md).

---

## 10. FiltroParaPagina

**Caminho:** `@/components/FiltroParaPagina.vue`

Ver documentação completa em [src/components/FiltroParaPagina.md](../../src/components/FiltroParaPagina.md).

---

## 11. Pinia Store Padrão para Listas

Stores **devem ser escritas em TypeScript** (`.store.ts`).

```typescript
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface Item {
  id: number;
  descricao: string;
  // adicionar campos conforme o DTO do backend
}

interface Estado {
  lista: Item[];
  emFoco: Item | null;
  chamadasPendentes: { lista: boolean; emFoco: boolean };
  erro: null | unknown;
}

export const useMinhaEntidadeStore = defineStore('minhaEntidade', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    chamadasPendentes: { lista: false, emFoco: false },
    erro: null,
  }),

  actions: {
    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/minha-entidade`, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async buscarItem(id: number): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;
      try {
        this.emFoco = await this.requestS.get(`${baseUrl}/minha-entidade/${id}`);
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;
      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/minha-entidade/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/minha-entidade`, params);
        }
        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro: unknown) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        await this.requestS.delete(`${baseUrl}/minha-entidade/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro: unknown) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },
  },

  getters: {
    itensPorId: ({ lista }): Record<number, Item> =>
      lista.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
```

### 11.1 Store com Paginação (MenuPaginacao)

O componente `MenuPaginacao` recebe um objeto `paginacao` via `v-bind`. As chaves devem ser camelCase, correspondendo às props do componente:

```typescript
// estado adicional
paginacao: {
  paginas: 0,
  temMais: false,
  tokenPaginacao: '',
  totalRegistros: 0,
},

// buscarTudo com paginação — mapear resposta da API para as props do MenuPaginacao
async buscarTudo(params = {}): Promise<void> {
  this.chamadasPendentes.lista = true;
  this.erro = null;
  try {
    const {
      linhas,
      paginas,
      tem_mais: temMais,
      token_proxima_pagina: tokenPaginacao,
      total: totalRegistros,
    } = await this.requestS.get(`${baseUrl}/minha-entidade`, params);

    this.lista = linhas;
    this.paginacao = {
      paginas: paginas ?? 0,
      temMais: temMais ?? false,
      tokenPaginacao: tokenPaginacao ?? '',
      totalRegistros: totalRegistros ?? 0,
    };
  } catch (erro: unknown) {
    this.erro = erro;
  }
  this.chamadasPendentes.lista = false;
},
```

No template, usar `v-bind="paginacao"` — colocar acima e abaixo da tabela em listas longas:

```vue
<MenuPaginacao class="mt2 bgb" v-bind="paginacao" />

<SmaeTable :dados="lista" :colunas="[...]" ... />

<MenuPaginacao class="mt2" v-bind="paginacao" />
```

No componente, reagir à mudança de página com `watchEffect` (em vez de `watch` com array de deps):

```typescript
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Rebusca automaticamente ao mudar pagina, token ou outros filtros na URL
watchEffect(() => {
  store.buscarTudo(route.query);
});
```

---

## 12. Configuração de Rotas

```javascript
import MinhaEntidadeRaiz from "@/views/minhaEntidade/MinhaEntidadeRaiz.vue";
import MinhaEntidadeLista from "@/views/minhaEntidade/MinhaEntidadeLista.vue";
import MinhaEntidadeCriarEditar from "@/views/minhaEntidade/MinhaEntidadeCriarEditar.vue";

export default {
  path: "minha-entidade",
  component: MinhaEntidadeRaiz,
  meta: {
    título: "Minha Entidade",
    limitarÀsPermissões: ["MinhaEntidade.listar"],
  },
  children: [
    {
      name: "minhaEntidade.listar",
      path: "",
      component: MinhaEntidadeLista,
      meta: { título: "Minha Entidade" },
    },
    {
      name: "minhaEntidade.criar",
      path: "novo",
      component: MinhaEntidadeCriarEditar,
      meta: {
        título: "Nova Entidade",
        rotasParaMigalhasDePão: ["minhaEntidade.listar"],
        rotaDeEscape: "minhaEntidade.listar",
      },
    },
    {
      name: "minhaEntidade.editar",
      path: ":entidadeId",
      component: MinhaEntidadeCriarEditar,
      props: ({ params }) => ({
        ...params,
        entidadeId: Number.parseInt(params.entidadeId, 10) || undefined,
      }),
      meta: {
        título: "Editar Entidade",
        rotasParaMigalhasDePão: ["minhaEntidade.listar"],
        rotaDeEscape: "minhaEntidade.listar",
      },
    },
  ],
};
```

---

## 13. Ordenação Client-Side

```javascript
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const parâmetroDeOrdenação = computed(() =>
  route.query.ordenar_por?.toLowerCase().trim(),
);
const ordemDeOrdenação = computed(() =>
  route.query.ordem?.toLowerCase().trim(),
);

const listaOrdenada = computed(() => {
  switch (parâmetroDeOrdenação.value) {
    case "atualizado_em":
    case "criado_em":
      return ordemDeOrdenação.value === "decrescente"
        ? lista.value.toSorted((a, b) =>
            a[parâmetroDeOrdenação.value] > b[parâmetroDeOrdenação.value]
              ? -1
              : 1,
          )
        : lista.value.toSorted((a, b) =>
            a[parâmetroDeOrdenação.value] > b[parâmetroDeOrdenação.value]
              ? 1
              : -1,
          );
    case "nome":
      return ordemDeOrdenação.value === "decrescente"
        ? lista.value.toSorted((a, b) => b.nome.localeCompare(a.nome))
        : lista.value.toSorted((a, b) => a.nome.localeCompare(b.nome));
    default:
      return lista.value;
  }
});

function aplicarOrdenação(nome, valor) {
  router.replace({ query: { ...route.query, [nome]: valor || undefined } });
}
```

---

## 14. Helpers Disponíveis

| Helper           | Caminho                    | Uso                                                    |
| ---------------- | -------------------------- | ------------------------------------------------------ |
| `filtrarObjetos` | `@/helpers/filtrarObjetos` | Filtra array por texto (recursivo, accent-insensitive) |
| `dateToField`    | `@/helpers/dateToField`    | Formata data para exibição                             |
| `dinheiro`       | `@/helpers/dinheiro`       | Formata valor monetário                                |
| `truncate`       | `@/helpers/truncate`       | Trunca texto longo                                     |
| `removerHtml`    | `@/helpers/removerHtml`    | Remove tags HTML                                       |

---

## 15. Exemplos Reais no Projeto

| Arquivo                                                                                                      | Características                                                         |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [EtiquetasLista.vue](src/views/projetos.etiquetas/EtiquetasLista.vue)                                        | SmaeTable mínimo, rotaEditar condicional por `pode_editar`              |
| [AreasTematicasLista.vue](src/views/areasTematicas/AreasTematicasLista.vue)                                  | SmaeTable com slots de célula customizados, LoadingComponent separado   |
| [AditivosLista.vue](src/views/tipoDeAditivo/AditivosLista.vue)                                               | SmaeTable + FiltroParaPagina com busca client-side via `filtrarObjetos` |
| [TransferenciasVoluntariasLista.vue](src/views/transferenciasVoluntarias/TransferenciasVoluntariasLista.vue) | Filtros na URL, paginação "carregar mais" (ainda usa tabela manual)     |
| [AcompanhamentosLista.vue](src/views/mdo.acompanhamentos/AcompanhamentosLista.vue)                           | Ordenação com URL query params (ainda usa tabela manual)                |
