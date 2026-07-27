# origens.csv

Uma linha por origem (meta / iniciativa / atividade do PdM) vinculada à obra.
Origens (meta/iniciativa/atividade do PdM) vinculadas ao projeto.
Uma linha por origem (meta/iniciativa/atividade de PDM) vinculada ao projeto.

Fontes que produzem este arquivo: `Obras`, `Projeto`, `Projetos`

10 colunas.

## `RelObrasOrigensCsvRow`

Colunas do CSV bruto de `origens.csv`.

Ordem do `SELECT` de `_queryDataOrigens()` — sem `fields` explícito.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | ID da Obra | não | sem formatação | — |
| `pdm_id` | `BIGINT` | ID do Programa de Metas | sim | sem formatação | — |
| `pdm_titulo` | `VARCHAR` | Programa de Metas | sim | — | — |
| `meta_id` | `BIGINT` | ID da Meta | sim | sem formatação | — |
| `meta_titulo` | `VARCHAR` | Meta | sim | — | — |
| `iniciativa_id` | `BIGINT` | ID da Iniciativa | sim | sem formatação | — |
| `iniciativa_titulo` | `VARCHAR` | Iniciativa | sim | — | — |
| `atividade_id` | `BIGINT` | ID da Atividade | sim | sem formatação | — |
| `atividade_titulo` | `VARCHAR` | Atividade | sim | — | — |

## `RelProjetoOrigemCsvRow`

Colunas do CSV bruto de `origens.csv` da fonte `Projeto`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `BIGINT` | ID do Projeto | não | sem formatação | — |
| `pdm_id` | `BIGINT` | ID do PdM | sim | sem formatação | — |
| `pdm_titulo` | `VARCHAR` | PdM | sim | — | — |
| `meta_id` | `BIGINT` | ID da Meta | sim | sem formatação | — |
| `meta_titulo` | `VARCHAR` | Meta | sim | — | — |
| `iniciativa_id` | `BIGINT` | ID da Iniciativa | sim | sem formatação | — |
| `iniciativa_titulo` | `VARCHAR` | Iniciativa | sim | — | — |
| `atividade_id` | `BIGINT` | ID da Atividade | sim | sem formatação | — |
| `atividade_titulo` | `VARCHAR` | Atividade | sim | — | — |

## `RelProjetosOrigensCsvRow`

`Decimal(7,4)` no banco. O rótulo já traz o `%`, então não há `unit`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `pdm_id` | `INTEGER` | ID PDM | sim | sem formatação | — |
| `pdm_titulo` | `VARCHAR` | Título do PDM | sim | — | — |
| `meta_id` | `INTEGER` | ID Meta | sim | sem formatação | — |
| `meta_titulo` | `VARCHAR` | Título da Meta | sim | — | — |
| `iniciativa_id` | `INTEGER` | ID Iniciativa | sim | sem formatação | — |
| `iniciativa_titulo` | `VARCHAR` | Título da Iniciativa | sim | — | — |
| `atividade_id` | `INTEGER` | ID Atividade | sim | sem formatação | — |
| `atividade_titulo` | `VARCHAR` | Título da Atividade | sim | — | — |

[← todos os arquivos](../report-columns.md)
