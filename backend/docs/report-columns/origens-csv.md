# origens.csv

Uma linha por origem (meta / iniciativa / atividade do PdM) vinculada à obra.

Fontes que produzem este arquivo: `Obras`

9 colunas.

Classe de linha: `RelObrasOrigensCsvRow`

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

[← todos os arquivos](../report-columns.md)
