# indicadores.csv

Uma linha por indicador, série (Realizado / RealizadoAcumulado) e período do recorte solicitado.

Fontes que produzem este arquivo: `PSIndicadores`

23 colunas.

Classe de linha: `RelIndicadoresCsvRow`

`indicadores.csv` — série do indicador (valor consolidado do próprio indicador).

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `pdm_nome` | `VARCHAR` | Plano Setorial | sim | — | — |
| `meta__codigo` | `VARCHAR` | Código da Meta | sim | — | — |
| `meta__titulo` | `VARCHAR` | Título da Meta | sim | — | — |
| `meta__id` | `BIGINT` | ID da Meta | não | sem formatação | — |
| `meta_tags_descricao` | `VARCHAR` | Meta Tags | sim | — | — |
| `meta_tags_ids` | `VARCHAR` | Tags IDs | sim | — | — |
| `iniciativa__codigo` | `VARCHAR` | Código da Iniciativa | sim | — | — |
| `iniciativa__titulo` | `VARCHAR` | Título da Iniciativa | sim | — | — |
| `iniciativa__id` | `BIGINT` | ID da Iniciativa | não | sem formatação | — |
| `atividade__codigo` | `VARCHAR` | Código da Atividade | sim | — | — |
| `atividade__titulo` | `VARCHAR` | Título da Atividade | sim | — | — |
| `atividade__id` | `BIGINT` | ID da Atividade | não | sem formatação | — |
| `indicador__codigo` | `VARCHAR` | Código do Indicador | sim | — | — |
| `indicador__titulo` | `VARCHAR` | Título do Indicador | sim | — | — |
| `indicador__contexto` | `VARCHAR` | Contexto | sim | — | — |
| `indicador__complemento` | `VARCHAR` | Complementação | sim | — | — |
| `indicador__id` | `BIGINT` | ID do Indicador | não | sem formatação | — |
| `data_referencia` | `DATE` | Data de Referência | sim | — | — |
| `serie` | `VARCHAR` | Serie | sim | — | — |
| `data` | `VARCHAR` | Data | sim | — | — |
| `valor` | `VARCHAR` | Valor | sim | — | — |
| `eh_previa` | `VARCHAR` | É Prévia | sim | — | — |
| `valores_categorica` | `VARCHAR` | Valores Categórica | sim | — | — |

[← todos os arquivos](../report-columns.md)
