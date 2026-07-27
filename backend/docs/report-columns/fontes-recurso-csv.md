# fontes_recurso.csv

Uma linha por fonte de recurso vinculada à obra.

Fontes que produzem este arquivo: `Obras`

5 colunas.

Classe de linha: `RelObrasFontesRecursoCsvRow`

Colunas do CSV bruto de `fontes_recurso.csv`.

Ordem do `SELECT` de `_queryDataFontesRecurso()` — o arquivo nunca teve `fields`
explícito, então o cabeçalho vinha da própria consulta.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | ID da Obra | não | sem formatação | — |
| `valor_percentual` | `DOUBLE` | Percentual | sim | 2 casas | — |
| `valor_nominal` | `DECIMAL(18,2)` | Valor Nominal | sim | R$, 2 casas | — |
| `fonte_recurso_ano` | `INTEGER` | Ano | sim | sem formatação | — |
| `fonte_recurso_cod_sof` | `VARCHAR` | Código SOF | sim | guard Excel | — |

[← todos os arquivos](../report-columns.md)
