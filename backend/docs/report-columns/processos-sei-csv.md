# processos_sei.csv

Uma linha por processo SEI registrado na obra.

Fontes que produzem este arquivo: `Obras`

7 colunas.

Classe de linha: `RelObrasProcessosSeiCsvRow`

Colunas do CSV bruto de `processos_sei.csv`.

Ordem do `SELECT` de `_queryDataObrasSei()` — sem `fields` explícito.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | ID da Obra | não | sem formatação | — |
| `categoria` | `VARCHAR` | Categoria | sim | — | — |
| `processo_sei` | `VARCHAR` | Processo SEI | sim | guard Excel | — |
| `descricao` | `VARCHAR` | Descrição | sim | — | — |
| `link` | `VARCHAR` | Link | sim | — | — |
| `comentarios` | `VARCHAR` | Comentários | sim | — | — |
| `observacoes` | `VARCHAR` | Observações | sim | — | — |

[← todos os arquivos](../report-columns.md)
