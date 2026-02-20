# FiltroParaPagina

Componente declarativo de filtros para páginas de listagem. Recebe um schema de campos e monta automaticamente o formulário com validação (vee-validate/Yup), sincronização com a query string da URL e exibição de erros por campo.

Internamente usa `FormularioQueryString` para persistência na URL. Para casos que exijam layout ou lógica além do que este componente oferece, use `FormularioQueryString` diretamente.

## Uso mínimo

```vue
<FiltroParaPagina
  :formulario="camposDeFiltro"
  :schema="MeuSchema"
/>
```

O consumidor assiste a `route.query` para disparar chamadas à API quando os filtros mudarem.

## Props

| Prop              | Tipo                      | Padrão      | Descrição |
|-------------------|---------------------------|-------------|-----------|
| `formulario`      | `Formulario` *(required)* | —           | Definição declarativa dos campos agrupados em linhas. Ver seção [Estrutura do formulário](#estrutura-do-formulário). |
| `schema`          | `Record<string, unknown>` *(required)* | — | Schema Yup para validação. Geralmente importado de `@/consts/formSchemas`. |
| `modelValue`      | `Record<string, unknown>` | `{}`        | Leitura bidirecional dos valores atuais do formulário via `v-model`. |
| `valoresIniciais` | `Record<string, unknown>` | `undefined` | Valores padrão dos campos. Passado para `FormularioQueryString`. |
| `autoSubmit`      | `boolean`                 | `false`     | Submete automaticamente ao detectar qualquer alteração. Oculta o botão "Pesquisar". |
| `carregando`      | `boolean`                 | `false`     | Desabilita o botão de submit enquanto verdadeiro. |
| `bloqueado`       | `boolean`                 | `false`     | Desabilita todos os campos do formulário. |
| `naoEmitirQuery`       | `boolean` | `false`     | Não atualiza a URL ao submeter nem ao montar. Útil em formulários inline que não devem poluir o histórico de navegação. |
| `prefixoDaPaginacao`   | `string`  | `''`        | Prefixo das chaves de paginação removidas ao submeter. Use quando a página convive com múltiplos componentes de paginação que usam o mesmo padrão de `prefixo` de `MenuPaginacao`. Ex.: `'tarefas_'` remove `tarefas_pagina` e `tarefas_token_paginacao`. |

## Eventos

| Evento                   | Payload                   | Quando é emitido |
|--------------------------|---------------------------|------------------|
| `filtro`                 | —                         | Após cada submit bem-sucedido (após validação). |
| `update:modelValue`      | `Record<string, unknown>` | A cada mudança nos valores do formulário. |
| `update:formularioSujo`  | `boolean`                 | Quando o estado "sujo" muda (campos diferentes dos valores commitados). |

## Estrutura do formulário

O tipo `Formulario` (exportado do componente) é um array de **linhas**:

```ts
import type { Formulario } from '@/components/FiltroParaPagina.vue';

type Formulario = Linha[]

type Linha = {
  class?: string                    // classe CSS do container dos campos
  campos: Record<string, CampoFiltro>  // chave = name do campo
  decorador?: 'esquerda' | 'direita'   // adiciona <hr> decorativo no lado indicado
}

type CampoFiltro = {
  tipo: 'select' | 'text' | 'search' | 'date' | 'checkbox' | 'autocomplete' | 'numeric'
  opcoes?: { id: string | number; label: string }[] | string[] | number[]
  autocomplete?: {
    label?: string    // prop do objeto usada como label (padrão: 'label')
    apenasUm?: boolean
  }
  class?: string                    // classe CSS do wrapper do campo
  atributos?: Record<string, unknown> // atributos extras (só para tipo 'numeric')
}
```

Os rótulos de cada campo são lidos automaticamente do schema Yup via `LabelFromYup`.

### Tipos de campo

| Tipo           | Renderiza | Observações |
|----------------|-----------|-------------|
| `text`         | `<input type="text">` | |
| `search`       | `<input type="search">` | |
| `date`         | `<input type="date">` | |
| `numeric`      | `<input type="text" inputmode="numeric">` | Aceita `atributos` extras |
| `checkbox`     | `<input type="checkbox" class="interruptor">` | |
| `select`       | `<select>` com `<option>` normalizadas | `opcoes` aceita `string[]`, `number[]` ou `{ id, label }[]` |
| `autocomplete` | `AutocompleteField2` | Para seleção com busca. Usar `autocomplete.label` e `autocomplete.apenasUm` |

## Comportamentos automáticos

- **Paginação:** ao submeter, remove `pagina` e `token_paginacao` da query (com o prefixo definido em `prefixoDaPaginacao`, se houver), evitando resultados desatualizados.
- **Valores vazios:** campos em branco são removidos da query (não ficam como `campo=`).
- **Sincronização bidirecional:** quando `naoEmitirQuery` não está ativo, mudanças externas na URL (ex.: navegação de volta) atualizam os campos automaticamente.
- **Estado sujo:** `update:formularioSujo` é emitido quando os valores do formulário divergem dos valores commitados, permitindo avisos visuais ao usuário.

## Exemplos

### Filtro simples com select e busca textual

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import { MeuFiltroSchema } from '@/consts/formSchemas';

const route = useRoute();

const camposDeFiltro = [
  {
    campos: {
      orgao_id: {
        tipo: 'select',
        opcoes: orgaos, // { id, label }[]
      },
      palavra_chave: { tipo: 'search' },
    },
  },
];

watch(
  () => [route.query.orgao_id, route.query.palavra_chave],
  () => store.buscarTudo(route.query),
  { immediate: true },
);
</script>

<template>
  <FiltroParaPagina
    :formulario="camposDeFiltro"
    :schema="MeuFiltroSchema"
    :carregando="chamadasPendentes.lista"
  />
</template>
```

### Múltiplas linhas com valores iniciais e estado sujo

```vue
<script setup lang="ts">
import { ref } from 'vue';

const formularioSujo = ref(false);

const valoresIniciais = {
  ipp: 30,
  ordem_direcao: 'desc',
};

const camposDeFiltro = [
  {
    campos: {
      portfolio_id: { tipo: 'select', opcoes: portfolios },
      status: { tipo: 'select', opcoes: statusOpcoes },
    },
  },
  {
    campos: {
      palavra_chave: { tipo: 'search', class: 'fb33' },
      ipp: { tipo: 'select', opcoes: [10, 30, 50, 100] },
    },
  },
];
</script>

<template>
  <FiltroParaPagina
    v-model:formulario-sujo="formularioSujo"
    :formulario="camposDeFiltro"
    :schema="MeuSchema"
    :valores-iniciais="valoresIniciais"
    :carregando="chamadasPendentes.lista"
    @filtro="limparSelecao"
  />

  <div :class="{ 'dependente-de-filtro-sujo': formularioSujo }">
    <!-- conteúdo da lista -->
  </div>
</template>
```

### Formulário sem persistência na URL (`naoEmitirQuery`)

Útil quando o filtro faz parte de um modal ou painel interno e não deve alterar a URL.

```vue
<FiltroParaPagina
  :formulario="camposDeFiltro"
  :schema="MeuSchema"
  :carregando="carregando"
  nao-emitir-query
  @filtro="buscarDados"
/>
```

Neste modo, o `@filtro` é o único gatilho para buscar dados — não há watch em `route.query`.

### AutoSubmit (sem botão "Pesquisar")

```vue
<FiltroParaPagina
  :formulario="camposDeFiltro"
  :schema="MeuSchema"
  auto-submit
/>
```

O formulário submete automaticamente a cada mudança de campo validada.
