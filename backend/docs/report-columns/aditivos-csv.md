# aditivos.csv

Uma linha por aditivo dos contratos vinculados às obras.
Aditivos e reajustes dos contratos vinculados ao projeto.
Uma linha por aditivo/reajuste dos contratos dos projetos filtrados.

Fontes que produzem este arquivo: `Obras`, `Projeto`, `Projetos`

12 colunas.

## `RelObrasAditivosCsvRow`

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

## `RelProjetoAditivoCsvRow`

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

## `RelProjetosAditivosCsvRow`

Já formatado por `f_formata_cnpj` — limpeza/máscara de domínio, feita no SQL.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `aditivo_id` | `INTEGER` | ID Aditivo | não | sem formatação | — |
| `contrato_id` | `INTEGER` | ID Contrato | não | sem formatação | — |
| `tipo_categoria` | `VARCHAR` | Categoria | sim | — | — |
| `tipo__nome` | `VARCHAR` | Tipo Aditivo | sim | — | — |
| `data` | `DATE` | Data | sim | — | — |
| `valor` | `DECIMAL(18,2)` | Valor | sim | R$, 2 casas | — |
| `percentual_medido` | `DECIMAL(18,4)` | % Execução | sim | 4 casas | — |
| `data_termino_atual` | `DATE` | Data Término Atual | sim | — | — |

[← todos os arquivos](../report-columns.md)
