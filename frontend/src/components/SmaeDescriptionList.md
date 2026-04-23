# SmaeDescriptionList

Componente para exibição de listas de descrição (`<dl>`) de forma padronizada, com suporte a layouts flexbox e grid.

## Uso Básico

### Com objeto simples

```vue
<SmaeDescriptionList
  :objeto="{ nome: 'João', idade: 30, cidade: 'São Paulo' }"
/>
```

### Filtrando e ordenando com `itensSelecionados` (opcional)

A prop opcional `itensSelecionados` define quais propriedades do `objeto` exibir e em que ordem. Cada item pode ser uma string (só a chave) ou um objeto com configurações extras:

```vue
<SmaeDescriptionList
  :objeto="{ nome: 'João', idade: 30, cidade: 'SP', email: 'j@j.com' }"
  :itens-selecionados="[
    { chave: 'nome', titulo: 'Nome completo' },
    { chave: 'idade', titulo: 'Idade (anos)', larguraBase: '10em' },
    'cidade',
  ]"
/>
```

Nesse exemplo, apenas `nome`, `idade` e `cidade` seriam exibidos (nessa ordem). A propriedade `email` seria omitida.

Sem a prop `itensSelecionados`, todas as propriedades do objeto são exibidas na ordem original.

**Importante:** quando usada com a prop `lista`, `itensSelecionados` **não** altera a ordem nem filtra os itens da lista. Nesse caso, ela serve apenas como fonte de configurações extras (títulos, `larguraBase`, `atributosDoItem`) para os itens correspondentes. A ordem e a seleção dos itens é sempre a da própria `lista`.

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
2. `titulo` definido em `itensSelecionados`
3. `label` do schema Yup
4. `chave` (fallback)

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `objeto` | `Record<string, string \| number \| null \| undefined>` | Não* | Objeto simples para conversão automática em lista |
| `lista` | `Array<ItemDeLista>` | Não* | Lista estruturada de itens |
| `itensSelecionados` | `Array<string \| ConfigDeItem>` | Não | Define quais campos exibir, sua ordem, títulos e configurações |
| `schema` | `AnyObjectSchema` (Yup) | Não | Schema Yup de onde os títulos (`label`) podem ser obtidos automaticamente |
| `layout` | `'flex' \| 'grid'` | Não | Layout do container. Padrão: `'flex'` |
| `quebrarAntesDe` | `Array<string \| number>` | Não | Define pontos de quebra na lista: cada valor é uma chave (string) ou índice (number) antes do qual se inicia um novo grupo |
| `larguraMinima` | `string` | Não | Largura mínima dos itens no modo grid (ex: `'15rem'`). Padrão: `''` (o CSS define `13rem` como fallback) |
| `maximoDeColunas` | `number \| string` | Não | Número máximo de colunas no modo grid. Limita o grid mantendo o comportamento responsivo. |

\* Pelo menos uma das props `objeto` ou `lista` deve ser fornecida.

### Tipo `ConfigDeItem`

```typescript
type ConfigDeItem = {
  chave: string;                           // Identificador do item
  titulo?: string;                         // Título exibido (opcional)
  larguraBase?: string;                    // Largura base (ex: '20em', '100%')
  atributosDoItem?: Record<string, unknown>; // Atributos HTML extras para o item
};
```

### Tipo `ItemDeLista`

```typescript
type ItemDeLista = ConfigDeItem & {
  valor: string | number | null | undefined; // Valor a ser exibido
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

## Layouts

O componente suporta dois layouts: `flex` (padrão) e `grid`.

### Layout Flex (padrão)

No modo flex, os itens expandem para preencher o espaço disponível. Use `larguraBase` para definir larguras específicas via `flex-basis`.

```vue
<SmaeDescriptionList
  :objeto="{ nome: 'João', idade: 30 }"
/>
```

### Layout Grid

No modo grid, os itens são distribuídos em colunas responsivas com largura mínima configurável. Ideal para listas com muitos campos.

```vue
<SmaeDescriptionList
  :objeto="dados"
  layout="grid"
/>
```

#### Configurando a largura mínima dos itens

Use a prop `larguraMinima` para definir a largura mínima das colunas no grid:

```vue
<SmaeDescriptionList
  :objeto="dados"
  layout="grid"
  largura-minima="15rem"
/>
```

#### Itens ocupando largura total no grid

No modo grid, use `larguraBase: '100%'` para que um item ocupe toda a largura disponível:

```vue
<SmaeDescriptionList
  :lista="[
    { chave: 'nome', valor: 'João' },
    { chave: 'descricao', valor: 'Texto longo...', larguraBase: '100%' },
  ]"
  layout="grid"
/>
```

## Controlando largura dos itens

### Usando a propriedade `larguraBase` (recomendado)

A largura dos itens pode ser controlada através da propriedade `larguraBase` (em `itensSelecionados` ou em itens de `lista`), que aceita qualquer valor CSS válido para `flex-basis`:

```vue
<SmaeDescriptionList
  :objeto="{ id: '12345', nome: 'João da Silva', descricao: 'Texto longo' }"
  :itens-selecionados="[
    { chave: 'id', titulo: 'ID', larguraBase: '5em' },
    { chave: 'nome', titulo: 'Nome completo', larguraBase: '20em' },
    { chave: 'descricao', titulo: 'Descrição', larguraBase: '100%' },
  ]"
/>
```

**Valores comuns:**
- `'20em'`, `'25em'`, `'50em'` - Larguras fixas em em
- `'100%'` - Ocupa 100% da largura disponível
- `'50%'` - Ocupa metade da largura

### Usando classes CSS (alternativa)

Alternativamente, você pode usar as classes utilitárias `fbLARGURAem` através de `atributosDoItem`:

| Classe | Largura |
|--------|---------|
| `fb3em` | 3em |
| `fb5em` | 5em |
| `fb10em` | 10em |
| `fb15em` | 15em |
| `fb20em` | 20em |
| `fb25em` | 25em |
| `fb50em` | 50em |
| `fb100` | 100% |

```vue
<SmaeDescriptionList
  :objeto="{ id: '12345', descricao: 'Texto longo' }"
  :itens-selecionados="[
    { chave: 'id', titulo: 'ID', atributosDoItem: { class: 'fb5em' } },
    { chave: 'descricao', titulo: 'Descrição', atributosDoItem: { class: 'f1 fb100' } },
  ]"
/>
```

**Nota:** A propriedade `larguraBase` é preferível por ser mais explícita e não depender de classes CSS globais.

## Estrutura HTML gerada

### Layout Flex

```html
<dl class="description-list description-list--flex">
  <div class="description-list__item">
    <dt class="description-list__term t12 uc w700 mb05 tamarelo">
      <!-- título ou chave -->
    </dt>
    <dd class="description-list__description t13">
      <!-- valor -->
    </dd>
  </div>
</dl>
```

### Layout Grid

```html
<dl class="description-list description-list--grid">
  <div class="description-list__item">
    <!-- ... -->
  </div>
  <div class="description-list__item description-list__item--full">
    <!-- item com larguraBase: '100%' -->
  </div>
</dl>
```

Com `larguraMinima` fornecida, o inline style é adicionado:

```html
<dl class="description-list description-list--grid" style="--dl-item-min-width: 15rem;">
  <!-- items -->
</dl>
```

#### Limitando o número máximo de colunas

Use a prop `maximoDeColunas` para evitar que o grid expanda para muitas colunas em telas grandes:

```vue
<SmaeDescriptionList
  :objeto="dados"
  layout="grid"
  largura-minima="13rem"
  :maximo-de-colunas="4"
/>
```

O responsivo continua funcionando: em telas estreitas as colunas colapsam normalmente.

## Comportamento

- Quando `valor` é `null`, `undefined` ou vazio, exibe "—" (travessão)
- Listas consecutivas recebem borda superior e espaçamento automático
- **Layout flex:** os itens usam `flex: 1` por padrão, expandindo para preencher o espaço disponível
- **Layout grid:** os itens são distribuídos em colunas responsivas usando `auto-fit` e `minmax()`
  - A largura mínima padrão é `13rem` (~180px, definida no CSS)
  - Use a prop `larguraMinima` para customizar esse valor, o que adiciona um inline style `--dl-item-min-width` ao container
