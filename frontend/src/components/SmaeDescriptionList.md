# SmaeDescriptionList

Componente para exibição de listas de descrição (`<dl>`) de forma padronizada, utilizando layout flexbox.

## Uso Básico

### Com objeto simples

```vue
<SmaeDescriptionList
  :objeto="{ nome: 'João', idade: 30, cidade: 'São Paulo' }"
/>
```

### Com mapa de títulos

```vue
<SmaeDescriptionList
  :objeto="{ nome: 'João', idade: 30 }"
  :mapa-de-titulos="{ nome: 'Nome completo', idade: 'Idade (anos)' }"
/>
```

### Com lista estruturada

```vue
<SmaeDescriptionList
  :lista="[
    { chave: 'nome', titulo: 'Nome completo', valor: 'João' },
    { chave: 'idade', titulo: 'Idade', valor: 30 },
  ]"
/>
```

### Com schema Yup

Os títulos podem ser obtidos automaticamente a partir dos `label` definidos no schema Yup, da mesma forma que o componente `SmaeLabel` faz.

```vue
<script setup>
import { object, string, number } from 'yup';

const schema = object({
  nome: string().label('Nome completo'),
  idade: number().label('Idade (anos)'),
});
</script>

<template>
  <SmaeDescriptionList
    :objeto="{ nome: 'João', idade: 30 }"
    :schema="schema"
  />
</template>
```

A ordem de prioridade para resolução de títulos é:

1. `titulo` do item (quando usando `lista`)
2. `mapaDeTitulos`
3. `label` do schema Yup
4. `chave` (fallback)

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `objeto` | `Record<string, string \| number \| null \| undefined>` | Não* | Objeto simples para conversão automática em lista |
| `lista` | `Array<ItemDeLista>` | Não* | Lista estruturada de itens |
| `mapaDeTitulos` | `Record<string, string>` | Não | Mapa de chaves para títulos legíveis |
| `schema` | `AnyObjectSchema` (Yup) | Não | Schema Yup de onde os títulos (`label`) podem ser obtidos automaticamente |

\* Pelo menos uma das props `objeto` ou `lista` deve ser fornecida.

### Tipo `ItemDeLista`

```typescript
type ItemDeLista = {
  chave: string;                           // Identificador único do item
  titulo?: string;                         // Título exibido (opcional)
  valor: string | number | null | undefined; // Valor a ser exibido
  atributosDoItem?: Record<string, unknown>; // Atributos HTML extras para o item
  metadados?: Record<string, unknown>;       // Dados extras para uso em slots
};
```

## Slots

O componente oferece slots flexíveis para personalização:

### Slot `termo`

Slot genérico para personalizar todos os termos.

```vue
<SmaeDescriptionList :objeto="dados">
  <template #termo="{ item }">
    <strong>{{ item.titulo || item.chave }}</strong>
  </template>
</SmaeDescriptionList>
```

### Slot `termo--[chave]`

Slot específico para um termo. Tem prioridade sobre o slot `termo`.

```vue
<SmaeDescriptionList :objeto="dados">
  <template #termo--nome="{ item }">
    <span class="destaque">{{ item.titulo }}</span>
  </template>
</SmaeDescriptionList>
```

### Slot `descricao`

Slot genérico para personalizar todas as descrições.

```vue
<SmaeDescriptionList :objeto="dados">
  <template #descricao="{ item }">
    <em>{{ item.valor || 'N/A' }}</em>
  </template>
</SmaeDescriptionList>
```

### Slot `descricao--[chave]`

Slot específico para a descrição de uma chave. Tem prioridade sobre o slot `descricao`.

```vue
<SmaeDescriptionList :objeto="dados">
  <template #descricao--status="{ item }">
    <span :class="['badge', item.valor]">{{ item.valor }}</span>
  </template>
</SmaeDescriptionList>
```

## Controlando largura dos itens

A largura dos itens pode ser controlada através da prop `atributosDoItem` usando as classes utilitárias `fbLARGURAem` disponíveis em `_base.less`:

| Classe | Largura |
|--------|---------|
| `fb3em` | 3em |
| `fb5em` | 5em |
| `fb10em` | 10em |
| `fb15em` | 15em |
| `fb20em` | 20em |
| `fb25em` | 25em |
| `fb50em` | 50em |

### Exemplo de uso com larguras personalizadas

```vue
<SmaeDescriptionList
  :lista="[
    {
      chave: 'id',
      titulo: 'ID',
      valor: '12345',
      atributosDoItem: { class: 'fb5em' }
    },
    {
      chave: 'nome',
      titulo: 'Nome completo',
      valor: 'João da Silva',
      atributosDoItem: { class: 'fb20em' }
    },
    {
      chave: 'descricao',
      titulo: 'Descrição',
      valor: 'Uma descrição mais longa que precisa de mais espaço',
      atributosDoItem: { class: 'fb50em' }
    },
  ]"
/>
```

## Estrutura HTML gerada

```html
<dl class="description-list flex g2 mb1 flexwrap">
  <div class="description-list__item f1 mb1">
    <dt class="description-list__term t12 uc w700 mb05 tamarelo">
      <!-- título ou chave -->
    </dt>
    <dd class="description-list__description t13">
      <!-- valor -->
    </dd>
  </div>
</dl>
```

## Comportamento

- Quando `valor` é `null`, `undefined` ou vazio, exibe "—" (travessão)
- Listas consecutivas recebem borda superior e espaçamento automático
- Os itens usam `flex: 1` por padrão, expandindo para preencher o espaço disponível
