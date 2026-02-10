# SmaeDescriptionList

Componente para exibição de listas de descrição (`<dl>`) de forma padronizada, utilizando layout flexbox.

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
