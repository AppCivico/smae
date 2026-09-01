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

2. **A listagem tem paginação?** Se sim, usar `MenuPaginacao`. Ver seção [MenuPaginacao](#7-menupaginacao).

---

## 3. Convenção de Arquivos e Nomes

```
src/views/<dominio>/
  <Entidade>Lista.vue          # Página de listagem
  <Entidade>Raiz.vue           # Layout raiz (nested routes)
  <Entidade>CriarEditar.vue    # Formulário criar/editar
```

---

## 4. Template Mínimo de Lista (padrão atual)

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

## 4.1 Watch para Filtros e Paginação

Se a lista tiver **filtros via URL** (`FiltroParaPagina` ou `route.query`), adicionar um `watch` que recarrega os dados quando os query params mudam:

```javascript
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// Recarrega quando qualquer filtro muda
watch(
  () => [route.query.campo1, route.query.campo2],
  () => {
    store.$reset();
    store.buscarTudo();
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

## 5. SmaeTable

**Caminho:** `@/components/SmaeTable/SmaeTable.vue`

Ver documentação completa em [src/components/SmaeTable/README.md](../../src/components/SmaeTable/README.md).

---

## 6. CabecalhoDePagina

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

## 7. MenuPaginacao

**Caminho:** `@/components/MenuPaginacao.vue`

Ver documentação completa em [src/components/MenuPaginacao.md](../../src/components/MenuPaginacao.md).

---

## 8. FiltroParaPagina

**Caminho:** `@/components/FiltroParaPagina.vue`

Ver documentação completa em [src/components/FiltroParaPagina.md](../../src/components/FiltroParaPagina.md).

---

## 9. Pinia Store

Ver documentação completa em [store-creation.md](store-creation.md).

---

## 10. Configuração de Rotas

```javascript
import tiparPropsDeRota from "@/router/helpers/tiparPropsDeRota";
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
      props: tiparPropsDeRota,
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

## 11. Ordenação Client-Side

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

## 12. Helpers Disponíveis

| Helper           | Caminho                    | Uso                                                    |
| ---------------- | -------------------------- | ------------------------------------------------------ |
| `filtrarObjetos` | `@/helpers/filtrarObjetos` | Filtra array por texto (recursivo, accent-insensitive) |
| `dateToField`    | `@/helpers/dateToField`    | Formata data para exibição                             |
| `dinheiro`       | `@/helpers/dinheiro`       | Formata valor monetário                                |
| `truncate`       | `@/helpers/truncate`       | Trunca texto longo                                     |
| `removerHtml`    | `@/helpers/removerHtml`    | Remove tags HTML                                       |

---

## 13. Exemplos Reais no Projeto

| Arquivo                                                                                                      | Características                                                         |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [EtiquetasLista.vue](src/views/projetos.etiquetas/EtiquetasLista.vue)                                        | SmaeTable mínimo, rotaEditar condicional por `pode_editar`              |
| [AreasTematicasLista.vue](src/views/areasTematicas/AreasTematicasLista.vue)                                  | SmaeTable com slots de célula customizados, LoadingComponent separado   |
| [AditivosLista.vue](src/views/tipoDeAditivo/AditivosLista.vue)                                               | SmaeTable + FiltroParaPagina com busca client-side via `filtrarObjetos` |
| [TransferenciasVoluntariasLista.vue](src/views/transferenciasVoluntarias/TransferenciasVoluntariasLista.vue) | Filtros na URL, paginação "carregar mais" (ainda usa tabela manual)     |
| [AcompanhamentosLista.vue](src/views/mdo.acompanhamentos/AcompanhamentosLista.vue)                           | Ordenação com URL query params (ainda usa tabela manual)                |
