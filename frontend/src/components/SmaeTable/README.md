# SmaeTable

Componente de tabela padrão do SMAE. Substitui o uso de `<table class="tablemain">` manual nas páginas de lista.

**Caminho:** `@/components/SmaeTable/SmaeTable.vue`

---

## Props

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `dados` | `Linha[]` | — | Array de objetos a renderizar (obrigatório) |
| `colunas` | `Coluna[]` | — | Definição das colunas (obrigatório) |
| `rotaEditar` | `string \| RouteLocationRaw \| (linha) => RouteLocationRaw` | — | Rota do botão editar. Função recebe a linha inteira. Retornar `false`/`null`/`undefined` oculta o botão. |
| `parametroDaRotaEditar` | `string` | `'id'` | Nome do parâmetro de rota |
| `parametroNoObjetoParaEditar` | `string` | `'id'` | Campo do objeto usado como valor do parâmetro |
| `esconderDeletar` | `boolean` | — | Oculta botão de excluir |
| `parametroNoObjetoParaExcluir` | `string` | `'descricao'` | Campo usado na mensagem de confirmação de exclusão |
| `mensagemExclusao` | `(linha) => string` | — | Função para mensagem customizada de confirmação |
| `titulo` | `string` | — | Caption da tabela |
| `schema` | `AnyObjectSchema` | — | Schema Yup para labels automáticos nos cabeçalhos |
| `replicarCabecalho` | `boolean` | — | Repete cabeçalho no rodapé |
| `rolagemHorizontal` | `boolean` | `false` | Envolve tabela em scroll horizontal |
| `tituloParaRolagemHorizontal` | `string` | — | Título para acessibilidade na rolagem horizontal (obrigatório se `rolagemHorizontal` e não há `titulo`) |
| `personalizarLinhas` | `{ parametro, alvo, classe }` | — | Aplica classe CSS condicional nas linhas |
| `subLinhaAbertaPorPadrao` | `boolean` | `false` | Sub-linhas expandidas por padrão |
| `subLinhaSempreVisivel` | `boolean` | `false` | Sub-linhas sempre visíveis (sem toggle) |
| `campoId` | `string` | `'id'` | Campo identificador (necessário para sub-linhas) |

---

## Tipo `Coluna`

```typescript
type Coluna = {
  chave: string;                                    // Acessa dado como linha[chave] (suporta notação ponto: 'obj.campo')
  label?: string;                                   // Texto do cabeçalho
  ehCabecalho?: boolean;                            // Renderiza célula como <th>
  formatador?: (valor: unknown) => string | number; // Transforma o valor exibido
  atributosDaCelula?: Record<string, unknown>;
  atributosDaColuna?: Record<string, unknown>;
  atributosDoCabecalhoDeColuna?: Record<string, unknown>;
  atributosDoRodapeDeColuna?: Record<string, unknown>;
  classe?: string | string[] | Record<string, unknown>;
};
```

---

## Evento

| Evento | Payload | Descrição |
|---|---|---|
| `@deletar` | `linha: Linha` | Emitido após confirmação de exclusão. Recebe o objeto completo da linha. |

---

## Slots

| Slot | Props | Descrição |
|---|---|---|
| `#celula:<chave>` | `{ linha, celula }` | Renderização customizada de célula. Ex: `#celula:ativo` |
| `#cabecalho:<chave>` | `coluna` | Cabeçalho customizado de coluna |
| `#acoes="{ linha }"` | `{ linha, linhaIndex }` | Substitui os botões padrão de editar/excluir |
| `#sub-linha="{ linha, linhaIndex }"` | `{ linha, linhaIndex }` | Linha expansível (accordion) |
| `#corpo="{ dados }"` | `{ dados }` | Corpo inteiro customizado |
| `#rodape="{ colunas }"` | `colunas` | Rodapé customizado |
| `#titulo` | — | Caption customizado |

O estado vazio é tratado automaticamente com a mensagem "Sem dados para exibir".

---

## Exemplos de Uso

### Mínimo

```vue
<SmaeTable
  :dados="lista"
  :colunas="[
    { chave: 'nome', label: 'Nome' },
    { chave: 'descricao', label: 'Descrição' },
  ]"
  :rota-editar="({ id }) => ({ name: 'entidade.editar', params: { entidadeId: id } })"
  parametro-no-objeto-para-excluir="descricao"
  @deletar="excluirItem"
/>
```

### rotaEditar condicional (permissão por item)

```vue
<SmaeTable
  :dados="lista"
  :colunas="[
    { chave: 'portfolio.titulo', label: 'Portfólio' },
    { chave: 'descricao', label: 'Descrição' },
  ]"
  :rota-editar="({ id, pode_editar }) => pode_editar && ({
    name: 'entidade.editar',
    params: { entidadeId: id }
  })"
  parametro-no-objeto-para-excluir="descricao"
  @deletar="excluirItem"
/>
```

### Células customizadas

```vue
<SmaeTable
  :dados="lista"
  :colunas="[
    { chave: 'nome', label: 'Nome' },
    { chave: 'ativo', label: 'Ativo' },
    { chave: 'valor', label: 'Valor', formatador: (v) => dinheiro(v) },
  ]"
  :rota-editar="({ id }) => ({ name: 'entidade.editar', params: { entidadeId: id } })"
  parametro-no-objeto-para-excluir="nome"
  @deletar="excluirItem"
>
  <template #celula:ativo="{ linha }">
    {{ linha.ativo ? 'Sim' : 'Não' }}
  </template>
</SmaeTable>
```

### Ações customizadas

```vue
<SmaeTable
  :dados="lista"
  :colunas="[{ chave: 'nome', label: 'Nome' }]"
>
  <template #acoes="{ linha }">
    <SmaeLink :to="{ name: 'entidade.detalhe', params: { id: linha.id } }">
      <svg width="16" height="16"><use xlink:href="#i_eye" /></svg>
    </SmaeLink>
    <SmaeLink
      v-if="linha.pode_editar"
      :to="{ name: 'entidade.editar', params: { id: linha.id } }"
    >
      <svg width="20" height="20"><use xlink:href="#i_edit" /></svg>
    </SmaeLink>
  </template>
</SmaeTable>
```

### Sub-linhas expansíveis (accordion)

```vue
<SmaeTable
  :dados="lista"
  :colunas="[
    { chave: 'nome', label: 'Nome' },
    { chave: 'total', label: 'Total' },
  ]"
  :rota-editar="({ id }) => ({ name: 'entidade.editar', params: { entidadeId: id } })"
  @deletar="excluirItem"
>
  <template #sub-linha="{ linha }">
    <td colspan="3">
      <p>{{ linha.descricao }}</p>
    </td>
  </template>
</SmaeTable>
```

### Com loading separado

```vue
<LoadingComponent v-if="chamadasPendentes.lista" />
<SmaeTable
  v-else
  :dados="lista"
  :colunas="[...]"
  ...
/>
```

---

## Exemplos Reais no Projeto

| Arquivo | Características |
|---|---|
| [EtiquetasLista.vue](../../views/projetos.etiquetas/EtiquetasLista.vue) | Mínimo, `rotaEditar` condicional por `pode_editar` |
| [AreasTematicasLista.vue](../../views/areasTematicas/AreasTematicasLista.vue) | Slots de célula customizados, `LoadingComponent` separado |
| [AditivosLista.vue](../../views/tipoDeAditivo/AditivosLista.vue) | Com `FiltroParaPagina` e filtro client-side |
