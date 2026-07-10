# MenuPaginacao

Componente de paginação que sincroniza com a URL via query params. Só renderiza quando `paginas > 1`.

**Caminho:** `@/components/MenuPaginacao.vue`

---

## Props

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `paginas` | `number` | `0` | Total de páginas |
| `temMais` | `boolean` | `false` | Se há mais páginas a carregar |
| `tokenPaginacao` | `string` | `''` | Token da próxima página (repassado na query) |
| `totalRegistros` | `number` | `0` | Total de registros — exibido como texto ao lado da navegação |
| `prefixo` | `string` | `''` | Prefixo para as chaves na URL (útil quando há múltiplos paginadores na mesma página) |

### v-model

Aceita `v-model` para controle de página sem alterar a URL (uso em modais ou listas embutidas).

---

## Eventos

| Evento | Payload | Descrição |
|---|---|---|
| `trocaDePaginaSolicitada` | `{ pagina: number }` | Emitido ao navegar para qualquer página |

---

## Comportamento

- Sem `v-model`: navega via `router.push` atualizando `route.query.pagina` e `route.query.token_paginacao`
- Com `v-model`: atualiza o model diretamente, sem alterar a URL
- O componente **não é renderizado** quando `paginas <= 1`
- O token da próxima página é preservado na query para permitir navegação para frente

---

## Uso com a URL (padrão)

### 1. No template

O padrão mais simples é passar o objeto `paginacao` da store com `v-bind`. Colocar **acima e abaixo** da tabela em listas longas:

```vue
<MenuPaginacao class="mt2 bgb" v-bind="paginacao" />

<SmaeTable :dados="lista" :colunas="[...]" ... />

<MenuPaginacao class="mt2" v-bind="paginacao" />
```

### 2. Na store (TypeScript)

O objeto `paginacao` deve ter as mesmas chaves das props (camelCase):

```typescript
interface Paginacao {
  paginas: number;
  temMais: boolean;
  tokenPaginacao: string;
  totalRegistros: number;
}

interface Estado {
  lista: Item[];
  paginacao: Paginacao;
  chamadasPendentes: { lista: boolean };
  erro: null | unknown;
}

// estado inicial
paginacao: {
  paginas: 0,
  temMais: false,
  tokenPaginacao: '',
  totalRegistros: 0,
},

// em buscarTudo, mapear a resposta da API
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

### 3. No componente: reagir à mudança de página

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

## Com prefixo (múltiplos paginadores na mesma página)

```vue
<MenuPaginacao v-bind="paginacaoDeObras" prefixo="obras_" />
<MenuPaginacao v-bind="paginacaoDeContratos" prefixo="contratos_" />
```

Com `prefixo="obras_"`, usa `route.query.obras_pagina` e `route.query.obras_token_paginacao`.

Ao usar junto com `FiltroParaPagina`, passar o mesmo prefixo para que o filtro resets a paginação correta:

```vue
<FiltroParaPagina
  :formulario="[...]"
  :schema="schema"
  prefixo-da-paginacao="obras_"
/>
```

---

## Exemplos Reais no Projeto

| Arquivo | Características |
|---|---|
| [ObrasListar.vue](../views/mdo.obras/ObrasListar.vue) | `v-bind="paginacao"`, paginador acima e abaixo da tabela |
| [ComunicadosGeraisLista.vue](../views/comunicadosGerais/ComunicadosGeraisLista.vue) | Com fallback "Buscar mais" quando `temMais` |
