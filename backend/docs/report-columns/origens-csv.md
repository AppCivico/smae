# origens.csv

Uma linha por origem (meta/iniciativa/atividade de PDM) vinculada ao projeto.

Fontes que produzem este arquivo: `Projetos`

9 colunas.

Classe de linha: `RelProjetosOrigensCsvRow`

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
