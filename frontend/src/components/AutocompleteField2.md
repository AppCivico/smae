# AutocompleteField2

Componente de autocomplete com suporte a seleção múltipla ou única, filtragem com normalização de diacríticos e navegação por teclado.

## Props

| Prop | Tipo | Obrigatória | Padrão | Descrição |
|------|------|:-----------:|--------|-----------|
| `controlador` | `Object` | Sim | - | Objeto reativo com `busca` (string) e `participantes` (array de ids). |
| `grupo` | `Array` | Não | `[]` | Lista de opções disponíveis. Cada item deve ter ao menos `id` e a propriedade indicada por `label`. |
| `label` | `String` | Sim | - | Nome da propriedade de cada item de `grupo` a ser exibida. |
| `name` | `String` | Não | `''` | Nome do campo para integração com vee-validate. |
| `numeroMaximoDeParticipantes` | `Number` | Não | `undefined` | Limite de itens selecionáveis. Ignorado quando `unique` é `true`. |
| `retornarArrayVazio` | `Boolean` | Não | `false` | Emite `change` com `[]` (ou `null` se `unique`) quando `grupo` está vazio. |
| `readonly` | `Boolean` | Não | `false` | Desabilita interações. Itens selecionados são exibidos como `<span>` em vez de `<button>`. |
| `unique` | `Boolean` | Não | `false` | Limita a seleção a um único item. O evento `change` emite o id diretamente em vez de array. |

## Eventos

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `change` | `Array<id>` ou `id \| null` | Emitido ao adicionar ou remover um item. Quando `unique` é `true`, emite o id do item ou `null`. |

## Attrs

Atributos não declarados como props (ex.: `placeholder`, `class`) são repassados ao `<input>` interno via `v-bind="$attrs"` (`inheritAttrs: false`).

## Uso

### Seleção multipla

```vue
<script setup>
import { reactive } from 'vue';

const controlador = reactive({
  busca: '',
  participantes: [],
});

const pessoas = [
  { id: 1, nome: 'Ana' },
  { id: 2, nome: 'João' },
  { id: 3, nome: 'José' },
];
</script>

<template>
  <AutocompleteField2
    :controlador="controlador"
    :grupo="pessoas"
    label="nome"
    placeholder="Buscar pessoa..."
    @change="(ids) => console.log('Selecionados:', ids)"
  />
</template>
```

### Seleção unica

```vue
<AutocompleteField2
  :controlador="controlador"
  :grupo="pessoas"
  label="nome"
  unique
  @change="(id) => console.log('Selecionado:', id)"
/>
```

### Com vee-validate

```vue
<AutocompleteField2
  :controlador="controlador"
  :grupo="pessoas"
  label="nome"
  name="responsavel_id"
/>
```

### Com limite de participantes

```vue
<AutocompleteField2
  :controlador="controlador"
  :grupo="pessoas"
  label="nome"
  :numero-maximo-de-participantes="3"
/>
```

## Navegacao por teclado

| Tecla | Contexto | Acao |
|-------|----------|------|
| `Enter` | Input | Seleciona o primeiro item que corresponde ao texto digitado. |
| `ArrowDown` | Input | Move o foco para o primeiro item da lista. |
| `ArrowDown` | Lista | Move o foco para o proximo item (cicla para o primeiro ao chegar no final). |
| `ArrowUp` | Lista | Move o foco para o item anterior. No primeiro item, retorna ao input. |
| `Enter` | Item da lista | Seleciona o item focado. |
| `Escape` | Input/Lista | Limpa o texto de busca e remove o foco. |

## Filtragem

A busca ignora maiusculas/minusculas e diacriticos. Por exemplo, digitar `"tres"` encontra `"Tres"`.

Itens ja selecionados sao automaticamente removidos da lista de sugestoes.

## Estrutura do controlador

O objeto `controlador` e mutado diretamente pelo componente:

- `controlador.busca`: atualizado via `v-model` no input e limpo apos selecao.
- `controlador.participantes`: array de ids, modificado por `push` e `splice`.

Como o componente muta o objeto, ele deve ser reativo (`reactive` ou propriedade de um `reactive`).
