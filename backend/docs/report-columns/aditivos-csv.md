# aditivos.csv

Uma linha por aditivo dos contratos vinculados às obras.

Fontes que produzem este arquivo: `Obras`

10 colunas.

Classe de linha: `RelObrasAditivosCsvRow`

Colunas do CSV bruto de `aditivos.csv`.

Ordem do `SELECT` de `_queryDataAditivos()` — sem `fields` explícito.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `aditivo_id` | `BIGINT` | ID do Aditivo | não | sem formatação | — |
| `contrato_id` | `BIGINT` | ID do Contrato | não | sem formatação | — |
| `numero` | `VARCHAR` | Número | sim | guard Excel | — |
| `tipo_aditivo_id` | `BIGINT` | ID do Tipo de Aditivo | sim | sem formatação | — |
| `tipo_aditivo_nome` | `VARCHAR` | Tipo de Aditivo | sim | — | — |
| `tipo_categoria` | `VARCHAR` | Categoria do Tipo | sim | — | — |
| `data` | `DATE` | Data | sim | — | — |
| `data_termino_atual` | `DATE` | Data de Término Atual | sim | — | — |
| `valor` | `DECIMAL(18,2)` | Valor | sim | R$, 2 casas | — |
| `percentual_medido` | `DECIMAL(18,4)` | Percentual Medido | sim | 2 casas | — |

[← todos os arquivos](../report-columns.md)
