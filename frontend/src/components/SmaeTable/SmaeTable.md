# SmaeTable

Componente de tabela padronizado. Gera `<colgroup>`, `<thead>`, `<tbody>` e `<tfoot>` automaticamente a partir de uma definição de colunas e de um array de dados.

## Uso básico

```vue
<SmaeTable
  :colunas="[
    { chave: 'nome', label: 'Nome' },
    { chave: 'esfera', label: 'Esfera' },
  ]"
  :dados="lista"
/>
```

Células sem slot customizado exibem o valor resolvido pelo caminho (`chave`) ou `'-'` para valores falsy.

---

## Props

### Dados e colunas

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `colunas` | `Coluna[]` | — | **Obrigatório.** Definição das colunas (ver seção [Coluna](#tipo-coluna)). |
| `dados` | `Linha[]` | — | **Obrigatório.** Array de objetos com os dados de cada linha. |
| `schema` | `AnyObjectSchema` | — | Schema Yup. Quando informado, o `label` do campo no schema é usado como cabeçalho, sobrepondo `label` da coluna. |

### Aparência e layout

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `titulo` | `string` | — | Texto exibido em `<caption>` acima da tabela. |
| `atributosDaTabela` | `Record<string, unknown>` | — | Atributos extras aplicados via `v-bind` ao elemento `<table>`. |
| `rolagemHorizontal` | `boolean` | `false` | Envolve a tabela em `RolagemHorizontal`. Requer `titulo`, `tituloParaRolagemHorizontal` ou `aria-label`. |
| `tituloParaRolagemHorizontal` | `string` | — | `aria-label` do contêiner de rolagem. Usado somente quando `rolagemHorizontal: true`. |
| `replicarCabecalho` | `boolean` | — | Exibe o cabeçalho também no `<tfoot>`. |
| `personalizarLinhas` | `{ parametro, alvo, classe }` | — | Aplica uma classe CSS a linhas onde `linha[parametro] === alvo`. |

### Sub-linhas

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `campoId` | `string` | `'id'` | Campo usado como chave única para controle de expansão de sub-linhas. |
| `subLinhaAbertaPorPadrao` | `boolean` | `false` | Expande todas as sub-linhas ao carregar. |
| `subLinhaSempreVisivel` | `boolean` | `false` | Mantém sub-linhas sempre visíveis (sem botão toggle). |

### Botão de editar

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `rotaEditar` | `string \| RouteLocationRaw \| (linha) => RouteLocationRaw` | — | Habilita a coluna de ações com um link de edição. Pode ser uma string de path, objeto de rota ou função que recebe a linha e retorna a rota. |
| `parametroDaRotaEditar` | `string` | `'id'` | Nome do parâmetro de rota para o link de edição. |
| `parametroNoObjetoParaEditar` | `string` | `'id'` | Campo do objeto de dados cujo valor é passado como parâmetro de rota. |

### Botão de excluir

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `esconderDeletar` | `boolean` | — | Oculta o botão de excluir mesmo quando a coluna de ações está visível. |
| `parametroNoObjetoParaExcluir` | `string` | `'descricao'` | Campo do objeto exibido na mensagem de confirmação de exclusão. |
| `mensagemExclusao` | `(linha) => string` | — | Função que retorna a mensagem de confirmação personalizada. |

---

## Eventos

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `@deletar` | `Linha` | Emitido após o usuário confirmar a exclusão no diálogo. |

---

## Tipo `Coluna`

```ts
type Coluna = {
  chave: string;                              // caminho para o valor na linha (suporta dot-notation)
  label?: string;                             // texto do cabeçalho
  ehCabecalho?: boolean;                      // renderiza a célula como <th> em vez de <td>
  formatador?: (valor: unknown) => string | number; // transforma o valor antes de exibir
  atributosDaColuna?: Record<string, unknown>;       // atributos do <col> no <colgroup>
  atributosDaCelula?: Record<string, unknown>;       // atributos do <td>/<th> de cada linha
  atributosDoCabecalhoDeColuna?: Record<string, unknown>; // atributos do <th> no <thead>
  atributosDoRodapeDeColuna?: Record<string, unknown>;    // atributos do <th> no <tfoot>
};
```

### Dot-notation no `chave`

O `chave` suporta caminhos aninhados. `obterPropriedadeNoObjeto` resolve o valor, e o nome do slot correspondente substitui o primeiro `.` por `__`:

```js
{ chave: 'tipo.nome', label: 'Tipo' }
// slot de célula: #celula:tipo__nome
// slot de cabeçalho: #cabecalho:tipo__nome
```

> **Atenção:** a prop `celula` exposta pelo slot `#celula:*` usa acesso direto (`linha[chave]`), então será `undefined` para caminhos aninhados. Nesses casos, acesse o valor via `linha` diretamente.

---

## Slots

### `#titulo`

Substitui o `<caption>` gerado automaticamente pela prop `titulo`.

### `#colunas="{ colunas }"`

Substitui o `<colgroup>` inteiro.

### `#cabecalho="{ colunas }"`

Substitui o `<tr>` dentro do `<thead>`.

### `#cabecalho:acao`

Conteúdo do `<td>` de cabeçalho da coluna de ações.

### `#cabecalho:{chave}="{ chave, label, ehCabecalho, ... }"`

Customiza o `<th>` de uma coluna específica no cabeçalho. O slot recebe as propriedades do objeto `Coluna` correspondente. O nome do slot é `cabecalho:` + `chave` normalizado (`.` → `__`).

### `#celula:{chave}="{ linha, celula }"`

Customiza o conteúdo de uma célula específica. O componente ainda renderiza o `<td>`/`<th>` com os atributos da coluna; o slot substitui apenas o conteúdo interno.

- `linha` — o objeto completo da linha
- `celula` — `linha[chave]` (acesso direto; `undefined` para dot-notation — use `linha` nesses casos)

```vue
<template #celula:data="{ linha }">
  <span :style="{ color: dataColor(linha.data) }">
    {{ new Date(linha.data).toLocaleDateString('pt-BR') }}
  </span>
</template>
```

### `#acoes="{ linha, linhaIndex }"`

Substitui o conteúdo padrão (botões de editar/excluir) da célula de ações. A coluna de ações é criada automaticamente quando este slot ou `rotaEditar` é usado.

```vue
<template #acoes="{ linha }">
  <button @click="abrir(linha.id)">Ver</button>
</template>
```

### `#sub-linha="{ linha, linhaIndex }"`

Exibe uma linha secundária expansível abaixo de cada linha principal. Requer que cada item em `dados` possua o campo definido em `campoId`.

Quando este slot é fornecido, o slot `#corpo` deixa de estar disponível.

### `#corpo="{ dados }"`

Substitui o conteúdo do `<tbody>`. Use para renderização completamente customizada de linhas (estados de carregamento, agrupamentos, etc.).

Não disponível quando `#sub-linha` é usado.

### `#conteudo="{ dados }"`

Substitui o bloco inteiro do corpo da tabela, incluindo o `<tbody>`. Slot de escape para casos não cobertos pelos demais.

### `#rodape="{ colunas }"`

Substitui o conteúdo do `<tfoot>`. Quando ausente e `replicarCabecalho: true`, o rodapé replica o cabeçalho automaticamente.

---

## Estados de carregamento e erro

O SmaeTable exibe `'Sem dados para exibir'` automaticamente quando `dados` está vazio. Estados de carregamento e erro devem ser gerenciados fora do componente:

```vue
<SmaeTable :dados="lista" :colunas="colunas" />
<p v-if="carregando">Carregando…</p>
<p v-else-if="erro">Erro: {{ erro }}</p>
```

---

## Rolagem horizontal

```vue
<SmaeTable
  :dados="lista"
  :colunas="colunas"
  rolagem-horizontal
  titulo="Transferências"
/>
```

A prop `titulo` (ou `aria-label` / `tituloParaRolagemHorizontal`) é obrigatória quando `rolagemHorizontal: true`, pois é usada como `aria-label` do contêiner de rolagem.

---

## Exemplos

### Com edição e exclusão integradas

```vue
<SmaeTable
  :dados="lista"
  :colunas="[{ chave: 'nome', label: 'Nome' }]"
  :rota-editar="({ id }) => ({ name: 'ItemEditar', params: { id } })"
  parametro-no-objeto-para-excluir="nome"
  @deletar="({ id }) => excluir(id)"
/>
```

### Com ações customizadas (permissões)

```vue
<SmaeTable :dados="lista" :colunas="colunas">
  <template #acoes="{ linha }">
    <router-link v-if="podeEditar" :to="rotaEditar(linha)">
      <svg width="20" height="20"><use xlink:href="#i_edit" /></svg>
    </router-link>
    <button v-if="podeExcluir" @click="excluir(linha.id)">
      <svg width="20" height="20"><use xlink:href="#i_remove" /></svg>
    </button>
  </template>
</SmaeTable>
```

### Com sub-linhas

```vue
<SmaeTable
  :dados="lista"
  :colunas="colunas"
  campo-id="id"
  sub-linha-aberta-por-padrao
>
  <template #sub-linha="{ linha }">
    <td colspan="3">{{ linha.detalhes }}</td>
  </template>
</SmaeTable>
```

### Com schema Yup (labels automáticos)

```vue
<SmaeTable
  :dados="lista"
  :colunas="[{ chave: 'nome' }, { chave: 'valor' }]"
  :schema="meuSchema"
/>
<!-- Os labels são extraídos de meuSchema.fields.nome.spec.label etc. -->
```

### Destacar linhas por condição

```vue
<SmaeTable
  :dados="lista"
  :colunas="colunas"
  :personalizar-linhas="{
    parametro: 'pendente',
    alvo: true,
    classe: 'linha--alerta'
  }"
/>
```
