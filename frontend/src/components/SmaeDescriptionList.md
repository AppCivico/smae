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

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `objeto` | `Record<string, string \| number \| null \| undefined>` | Não* | Objeto simples para conversão automática em lista |
| `lista` | `Array<ItemDeLista>` | Não* | Lista estruturada de itens |
| `mapaDeTitulos` | `Record<string, string>` | Não | Mapa de chaves para títulos legíveis |

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

### Slot `chave`
Slot genérico para personalizar todas as chaves (termos).

```vue
<SmaeDescriptionList :objeto="dados">
  <template #chave="{ item }">
    <strong>{{ item.titulo || item.chave }}</strong>
  </template>
</SmaeDescriptionList>
```

### Slot `chave--[nome]`
Slot específico para uma chave. Tem prioridade sobre o slot `chave`.

```vue
<SmaeDescriptionList :objeto="dados">
  <template #chave--nome="{ item }">
    <span class="destaque">{{ item.titulo }}</span>
  </template>
</SmaeDescriptionList>
```

### Slot `valor`
Slot genérico para personalizar todos os valores.

```vue
<SmaeDescriptionList :objeto="dados">
  <template #valor="{ item }">
    <em>{{ item.valor || 'N/A' }}</em>
  </template>
</SmaeDescriptionList>
```

### Slot `valor--[nome]`
Slot específico para o valor de uma chave. Tem prioridade sobre o slot `valor`.

```vue
<SmaeDescriptionList :objeto="dados">
  <template #valor--status="{ item }">
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
