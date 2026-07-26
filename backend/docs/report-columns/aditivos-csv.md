# aditivos.csv

Aditivos e reajustes dos contratos vinculados ao projeto.

Fontes que produzem este arquivo: `Projeto`

9 colunas.

Classe de linha: `RelProjetoAditivoCsvRow`

Colunas do CSV bruto de `aditivos.csv` da fonte `Projeto` (uma linha por aditivo).

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `aditivo_id` | `BIGINT` | ID do Aditivo | não | sem formatação | — |
| `contrato_id` | `BIGINT` | ID do Contrato | não | sem formatação | — |
| `tipo_categoria` | `VARCHAR` | Categoria do Tipo | sim | — | — |
| `tipo__id` | `BIGINT` | Tipo de Aditivo - ID | sim | sem formatação | — |
| `tipo__nome` | `VARCHAR` | Tipo de Aditivo | sim | — | — |
| `data` | `DATE` | Data | sim | — | — |
| `valor` | `DECIMAL(18,2)` | Valor | sim | R$, 2 casas | — |
| `percentual_medido` | `DECIMAL(18,4)` | Percentual Medido | sim | 2 casas, unidade `%` | — |
| `data_termino_atual` | `DATE` | Data de Término Atual | sim | — | — |

[← todos os arquivos](../report-columns.md)
