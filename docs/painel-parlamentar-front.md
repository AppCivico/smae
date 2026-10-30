# Painel do Parlamentar (guia para o front-end)

Tela: **Painel do Parlamentar**, acessada a partir de Configurações >> Parlamentares.

O back-end já está pronto ([AppCivico/smae#821](https://github.com/AppCivico/smae/pull/821)). Este guia descreve os
dois endpoints novos, o privilégio de acesso e como cada bloco do layout se liga aos campos da resposta.

## Contexto

O painel mostra, para um parlamentar, um resumo de cadastro e os números das transferências em que ele tem emenda:

| Bloco do layout | De onde vem |
| --- | --- |
| Foto, nome, mandato, votos, biografia, representatividade | `GET /painel-parlamentar/:id` → `parlamentar` |
| Transferências 12/20 | `GET /painel-parlamentar/:id` → `transferencias` |
| Recurso Disponibilizado e Utilizado | `GET /painel-parlamentar/:id` → `recurso` |
| Participação no Município | `GET /painel-parlamentar/:id` → `participacao_municipio` |
| Total por Secretaria | `GET /painel-parlamentar/:id` → `por_secretaria` |
| Participação por partido | `GET /painel-parlamentar/:id` → `por_partido` |
| Transferências em andamento (lista + paginação) | `GET /painel-parlamentar/:id/transferencias` |

São dois endpoints de propósito. Trocar de página, mudar a ordenação ou filtrar por secretaria na lista **não**
deve recarregar os gráficos: só chame o segundo endpoint nesses casos.

Não é preciso chamar `GET /parlamentar/:id` para montar o painel: os dados de perfil já vêm no primeiro endpoint.

## Acesso

Os dois endpoints exigem o privilégio novo **`CadastroParlamentar.painel`**. Por padrão, só o perfil Gestor Casa
Civil recebe esse privilégio.

```ts
const authStore = useAuthStore();
const podeVerPainel = authStore.temPermissãoPara('CadastroParlamentar.painel');
```

Use essa checagem para mostrar o link do painel e em `meta.limitarÀsPermissões` da rota nova.

Usuários do perfil Gestor de Distribuição de Recurso que receberem o privilégio veem só as transferências que têm
distribuição do órgão deles, e só as distribuições desse órgão. O back-end faz esse recorte; o front não precisa
fazer nada.

## Tipos

Todos os tipos ficam em `@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity` e os filtros em
`@back/casa-civil/painel-parlamentar/dto/filter-painel-parlamentar.dto`:

```ts
import type {
  PainelParlamentarDto,
  PainelParlamentarTransferenciaDto,
} from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';
import type {
  FilterPainelParlamentarDto,
  FilterPainelParlamentarTransferenciasDto,
} from '@back/casa-civil/painel-parlamentar/dto/filter-painel-parlamentar.dto';
import type { PaginatedWithPagesDto } from '@back/common/dto/paginated.dto';
```

Regras que valem para os dois endpoints:

- **Valores em reais** chegam como `number` (ex.: `55080000`). Formate com o helper
  [`dinheiro`](../frontend/src/helpers/dinheiro.js).
- **Percentuais** chegam como `number` de 0 a 100 com até 2 casas (ex.: `72.5`). Quando o denominador é zero, o
  percentual vem `0`, nunca `NaN`.
- **Transferências canceladas** ficam fora de todos os números e da lista.

---

## 1. Filtros do topo (período)

O período do layout ("Começo" / "Fim") filtra pelo **ano da transferência**. São dois anos, não duas datas:

| Query param | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| `ano_inicio` | número inteiro | não | ano inicial, inclusivo |
| `ano_fim` | número inteiro | não | ano final, inclusivo |

- Sem os dois, o painel considera todos os anos.
- `ano_inicio` maior que `ano_fim` devolve **400**.
- Para montar as opções dos dropdowns, o helper [`gerarListaAnos`](../frontend/src/helpers/gerarListaAnos.ts) já
  existe.
- O seletor de parlamentar do topo só troca o `:id` da URL.

Ao clicar em **Filtrar**, chame os dois endpoints com o mesmo `ano_inicio` / `ano_fim`, e volte a lista para a
página 1 (sem token).

---

## 2. `GET /painel-parlamentar/:id` (perfil, KPIs e gráficos)

```http
GET /painel-parlamentar/2?ano_inicio=2024&ano_fim=2026
```

- Parlamentar inexistente ou removido devolve **404**.

### Resposta

```ts
class PainelParlamentarDto {
  parlamentar: PainelParlamentarPerfilDto;
  transferencias: { total: number; em_andamento: number };
  recurso: { valor_disponibilizado: number; valor_utilizado: number; pct_utilizado: number };
  participacao_municipio: { valor_parlamentar: number; valor_total: number; pct: number };
  por_secretaria: PainelParlamentarPorSecretariaDto[];
  por_partido: PainelParlamentarPorPartidoDto[];
}
```

### 2.1 Perfil (`parlamentar`)

```ts
class PainelParlamentarPerfilDto {
  id: number;
  nome: string;                 // nome civil
  nome_popular: string | null;  // nome parlamentar
  nascimento: string | null;    // 'YYYY-MM-DD' (aniversário)
  telefone: string | null;      // null se o usuário não tiver SMAE.acesso_telefone
  email: string | null;
  foto: string | null;          // token de download
  mandato_atual: PainelParlamentarMandatoDto | null;
  representatividade_capital: RepresentatividadeDto[];
  representatividade_interior: RepresentatividadeDto[];
}

class PainelParlamentarMandatoDto {
  cargo: ParlamentarCargo;      // Senador | DeputadoEstadual | DeputadoFederal | Vereador
  eleicao: EleicaoDto;          // { id, ano, tipo, atual_para_mandatos }
  partido_candidatura: PartidoDto;
  partido_atual: PartidoDto;
  votos_estado: number | null;
  votos_capital: number | null;
  votos_interior: number | null;
  atuacao: string | null;       // área de atuação
  biografia: string | null;
}
```

| Item pedido | Campo |
| --- | --- |
| Nome, Nome civil | `nome_popular`, `nome` |
| Aniversário, Telefone, e-mail | `nascimento`, `telefone`, `email` |
| Cargo, eleição, partido da candidatura, partido atual | `mandato_atual.cargo`, `.eleicao`, `.partido_candidatura`, `.partido_atual` |
| Votos no estado, na capital, no interior | `mandato_atual.votos_estado`, `.votos_capital`, `.votos_interior` |
| Área de atuação, Biografia | `mandato_atual.atuacao`, `mandato_atual.biografia` |
| Representatividade na capital / no interior | `representatividade_capital`, `representatividade_interior` |

- **`mandato_atual`** é o mandato da eleição marcada como atual. Se o parlamentar não tiver nenhum mandato, vem
  `null`: esconda os campos de mandato.
- **`foto`** é um token de download válido por 1 dia. Monte a URL como em
  [`ParlamentarDetalhe.vue`](../frontend/src/views/parlamentares/ParlamentarDetalhe.vue):
  `` `${baseUrl}/download/${foto}?inline=true` ``.
- **Representatividade**: cada lista já vem ordenada pelo `ranking`. Cada item é o mesmo `RepresentatividadeDto`
  do cadastro (`regiao.descricao`, `numero_votos`, `pct_participacao`, `ranking`, `regiao.comparecimento.valor`),
  então os componentes da tela de detalhe podem ser reaproveitados.

### 2.2 Transferências (`transferencias`)

No layout: **12/20 — Transferências em andamento/total**.

- `em_andamento` (o 12): transferências com o workflow ainda não finalizado, incluindo as que ainda não iniciaram
  o workflow.
- `total` (o 20): todas as transferências do parlamentar no período.

### 2.3 Recurso disponibilizado e utilizado (`recurso`)

| Layout | Campo |
| --- | --- |
| "Valor Disponibilizado: R$55.080.000,00" | `valor_disponibilizado` (soma do valor indicado pelo parlamentar nas transferências) |
| Valor abaixo da barra (R$39.657.600,00) | `valor_utilizado` (soma do valor do parlamentar nas distribuições de recurso que contam) |
| 72% | `pct_utilizado` |

Distribuições canceladas, declinadas etc. não entram em `valor_utilizado`.

### 2.4 Participação no município (`participacao_municipio`)

No layout: **37%**, com a legenda "Percentual do total disponibilizado pelo parlamentar em relação ao total
disponibilizado para o município nas transferências em andamento".

- `valor_parlamentar`: valor do parlamentar nas transferências em andamento.
- `valor_total`: valor de **todos** os parlamentares nas transferências em andamento do mesmo período.
- `pct`: `valor_parlamentar ÷ valor_total`, em %.

### 2.5 Total por secretaria (`por_secretaria`)

```ts
class PainelParlamentarPorSecretariaDto {
  orgao: { id: number; sigla: string; descricao: string } | null; // null na linha "Outros"
  rotulo: string;   // sigla do órgão, ou "Outros"
  outros: boolean;  // true só na linha "Outros"
  valor: number;    // valor do parlamentar nas distribuições desse órgão
  pct: number;      // participação no recurso.valor_utilizado, em %
}
```

- A lista já vem **ordenada do maior para o menor valor**, com no máximo 5 órgãos e, se houver mais, uma última
  linha `outros: true` somando o restante. Basta desenhar na ordem recebida.
- Use `rotulo` como legenda (SETRI, SEPEP… OUTROS) e `valor` como tamanho da barra.
- Órgãos com valor zero não aparecem. Lista vazia significa que não há distribuição com valor: mostre um estado
  vazio.

### 2.6 Participação por partido (`por_partido`)

```ts
class PainelParlamentarPorPartidoDto {
  partido: { id: number; sigla: string; nome: string } | null; // null em "Outros" e em "Sem partido"
  rotulo: string;   // sigla do partido, "Sem partido" ou "Outros"
  outros: boolean;
  valor: number;    // valor do parlamentar nas transferências registradas com esse partido
  pct: number;      // participação no recurso.valor_disponibilizado, em %
}
```

- Mesma estrutura do gráfico por secretaria: ordenado, top 5 e uma linha "Outros".
- O partido é o **registrado em cada transferência**, não o partido atual do mandato. Por isso um parlamentar
  que trocou de partido aparece com mais de uma fatia.
- `partido: null` com `outros: false` é a fatia "Sem partido" (transferência sem partido informado).
- Use `valor` para o tamanho das fatias do donut e `rotulo` + `valor` na legenda.

---

## 3. `GET /painel-parlamentar/:id/transferencias` (lista)

```http
GET /painel-parlamentar/2/transferencias?ano_inicio=2024&ano_fim=2026&ordem_orgao_id=14&ordem_valor=asc&ipp=10
```

### Query params

| Param | Tipo | Padrão | Observação |
| --- | --- | --- | --- |
| `ano_inicio`, `ano_fim` | número | — | os mesmos do painel |
| `ordem_orgao_id` | número | — | "Ordenar por → Secretaria": transferências com distribuição desse órgão vêm primeiro; dentro de cada transferência, as distribuições desse órgão também vêm primeiro |
| `ordem_valor` | `'asc' \| 'desc'` | `'desc'` | "Ordenar por → Valor": crescente/decrescente pelo valor do repasse. Com `ordem_orgao_id`, ordena dentro de cada grupo |
| `orgao_gestor_id` | número | — | filtro opcional (não aparece no layout): **esconde** as transferências sem distribuição desse órgão |
| `ipp` | número (1–200) | `25` | itens por página |
| `pagina` | número | `1` | página pedida |
| `token_paginacao` | string | — | obrigatório a partir da página 2 |

Os dois campos de "Ordenar por" do layout combinam assim: `ordem_orgao_id=14&ordem_valor=asc` traz primeiro as
transferências com distribuição do órgão 14, da menor para a maior, e depois as demais, também da menor para a maior.
Nenhuma transferência some da lista. Sem `ordem_orgao_id`, só o valor ordena.

Mudar qualquer um dos dois muda a ordem da lista. Por isso, volte para a página 1 sem `token_paginacao` (ver
"Paginação").

Para as opções do campo "Secretaria", use a lista de órgãos que o front já carrega em outras telas de
transferência. As siglas de `por_secretaria` do painel também servem, mas trazem só o top 5.

### Paginação

A resposta segue o `PaginatedWithPagesDto`, o mesmo formato do painel estratégico de transferências:

```ts
{
  linhas: PainelParlamentarTransferenciaDto[];
  token_paginacao: string;   // guarde e reenvie nas próximas páginas
  paginas: number;           // total de páginas ("DE 42")
  pagina_corrente: number;
  tem_mais: boolean;         // controla o "SEGUINTE"
  total_registros: number;
  token_ttl: number;
}
```

Fluxo:

1. **Primeira chamada** (ou depois de mudar qualquer filtro): `pagina=1` e **sem** `token_paginacao`. Guarde o
   `token_paginacao` da resposta.
2. **Outras páginas**: envie `pagina=N`, o `token_paginacao` guardado e **exatamente os mesmos filtros**, incluindo
   o mesmo `ipp`.
3. Mudou período, secretaria, ordem ou `ipp`? Descarte o token e volte ao passo 1.

Erros **400** possíveis:
- `pagina` maior que 1 sem token;
- filtros diferentes dos usados para gerar o token;
- token inválido ou expirado. O token vale 24 horas (`token_ttl`); nesse caso, volte à página 1.

Parlamentar inexistente ou removido devolve **404**.

### Item da lista

```ts
class PainelParlamentarTransferenciaDto {
  id: number;                 // para o link interno
  identificador: string;
  objeto: string;
  valor_repasse: number;      // "Valor do repasse"
  valor_distribuido: number;  // "Valor distribuído"
  valor_parlamentar: number;  // valor indicado por este parlamentar na transferência
  etapa: string | null;       // "Etapa: Proposta"
  fase: string | null;        // "Fase: Assinatura"
  fase_status: string | null; // "- em andamento"
  distribuicoes: PainelParlamentarDistribuicaoDto[];
}

class PainelParlamentarDistribuicaoDto {
  id: number;
  nome: string | null;        // "Computadores para creches"
  objeto: string;
  orgao: { id: number; sigla: string; descricao: string };  // "Órgão: SETRI"
  situacao: string | null;    // "Situação: Em andamento" / "Cancelado"
  contabilizada: boolean;     // false para canceladas, declinadas etc.
  valor: number;              // "Valor da distribuição"
  valor_parlamentar: number;  // valor do parlamentar nesta distribuição (abaixo da barra)
  pct_parlamentar: number;    // 20% / 50% ao lado da barra
}
```

Ligação com o layout:

- **Situação da transferência**: monte com `etapa`, `fase` e `fase_status`, ex.:
  `Etapa: ${etapa}` e `Fase: ${fase} - ${fase_status}`. Qualquer um dos três pode vir `null` (workflow não iniciado):
  esconda a linha correspondente.
- **Nome da distribuição**: use `nome` e, se vier `null`, use `objeto`.
- **Barra de cada distribuição**: `pct_parlamentar` é `valor_parlamentar ÷ valor`. A legenda é "Valor investido
  pelo parlamentar nesta distribuição".
- **Distribuição em cinza**: quando `contabilizada === false` (no layout, "Quadros digitais — Cancelado"). Essas
  distribuições aparecem na lista, mas não entram em `valor_distribuido` nem nos números do painel.
- **Distribuição sem participação do parlamentar**: vem com `valor_parlamentar: 0` e `pct_parlamentar: 0`. A
  lista traz todas as distribuições da transferência, não só as que têm valor do parlamentar.
- **Lista sem distribuição**: `distribuicoes: []` é possível (transferência ainda sem distribuição). Esconda o
  bloco "Distribuições".

### Link interno

O `id` leva ao resumo da transferência:

```ts
{ name: 'TransferenciasVoluntariasDetalhes', params: { transferenciaId: item.id } }
```

Para levar à lista de distribuições da transferência:

```ts
{ name: 'TransferenciaDistribuicaoDeRecursos.Lista', params: { transferenciaId: item.id } }
```

As rotas de transferência continuam exigindo os próprios privilégios. Um usuário pode ver o painel e não conseguir
abrir a transferência.

---

## Sugestão de implementação

Nada disso é obrigatório. É o caminho que segue o padrão das outras telas.

1. **Store** `frontend/src/stores/painelParlamentar.store.ts`, no formato de
   [`panoramaTransferencias.store.ts`](../frontend/src/stores/panoramaTransferencias.store.ts):
   - estado `painel`, `lista`, `paginacao`, `chamadasPendentes: { painel, lista }` e `erro`;
   - ação `buscarPainel(id, { ano_inicio, ano_fim })` chamando `this.requestS.get(\`${baseUrl}/painel-parlamentar/${id}\`, params)`;
   - ação `buscarTransferencias(id, params)` guardando `token_paginacao` e `paginas`.
2. **Rota** filha em [`router/parlamentares.js`](../frontend/src/router/parlamentares.js), ex.
   `path: ':parlamentarId/painel'`, `name: 'parlamentarPainel'`, com
   `meta.limitarÀsPermissões: 'CadastroParlamentar.painel'`. Use o mesmo `props` de `parlamentarDetalhe`, que
   converte `parlamentarId` em número.
3. **Filtros na query string** (`ano_inicio`, `ano_fim`, `ordem_orgao_id`, `ordem_valor`, `pagina`), para o
   painel poder ser compartilhado por link e o botão voltar funcionar.
4. **Carregamento**: ao montar a tela ou ao clicar em "Filtrar", chame os dois endpoints em paralelo. Ao clicar em
   "Ordenar" ou trocar de página, chame só a lista.

## Exemplo de resposta (painel)

```json
{
  "parlamentar": {
    "id": 2,
    "nome": "Gilberto da Silva",
    "nome_popular": "Gilzinho",
    "nascimento": "1958-04-12",
    "telefone": null,
    "email": "gilzinho@example.com",
    "foto": "eyJhbGciOi...",
    "mandato_atual": {
      "cargo": "Vereador",
      "eleicao": { "id": 3, "ano": 2024, "tipo": "Municipal", "atual_para_mandatos": true },
      "partido_candidatura": { "id": 23, "sigla": "PODE", "nome": "Podemos", "numero": 20 },
      "partido_atual": { "id": 23, "sigla": "PODE", "nome": "Podemos", "numero": 20 },
      "votos_estado": null,
      "votos_capital": 45210,
      "votos_interior": null,
      "atuacao": "Educação",
      "biografia": "..."
    },
    "representatividade_capital": [],
    "representatividade_interior": []
  },
  "transferencias": { "total": 20, "em_andamento": 12 },
  "recurso": { "valor_disponibilizado": 1800000, "valor_utilizado": 1701000, "pct_utilizado": 94.5 },
  "participacao_municipio": { "valor_parlamentar": 1200000, "valor_total": 3243243.24, "pct": 37 },
  "por_secretaria": [
    { "orgao": { "id": 15, "sigla": "SEPEP", "descricao": "..." }, "rotulo": "SEPEP", "outros": false, "valor": 900000, "pct": 52.91 },
    { "orgao": { "id": 8, "sigla": "SETRI", "descricao": "..." }, "rotulo": "SETRI", "outros": false, "valor": 800000, "pct": 47.03 },
    { "orgao": null, "rotulo": "Outros", "outros": true, "valor": 1000, "pct": 0.06 }
  ],
  "por_partido": [
    { "partido": { "id": 30, "sigla": "PT", "nome": "Partido dos Trabalhadores" }, "rotulo": "PT", "outros": false, "valor": 1500000, "pct": 83.33 },
    { "partido": { "id": 23, "sigla": "PODE", "nome": "Podemos" }, "rotulo": "PODE", "outros": false, "valor": 299000, "pct": 16.61 },
    { "partido": null, "rotulo": "Sem partido", "outros": false, "valor": 1000, "pct": 0.06 }
  ]
}
```

Os valores do exemplo são ilustrativos. Repare que as fatias de `por_secretaria` somam `recurso.valor_utilizado`
e as de `por_partido` somam `recurso.valor_disponibilizado`.
