# cronograma.csv

Linhas do cronograma (tarefas) do projeto.
Linhas do cronograma (tarefas) das transferências filtradas.

Fontes que produzem este arquivo: `Projeto`, `Transferencias`

15 colunas.

## `RelProjetoCronogramaCsvRow`

Colunas do CSV bruto de `cronograma.csv` da fonte `Projeto` (uma linha por tarefa).

O nome `hirearquia` tem o typo de origem preservado: é o nome da propriedade no DTO
`RelProjetoCronogramaDto` (que também é resposta da API `POST /relatorio/projeto`) e
renomeá-lo mudaria o contrato daquele endpoint. O rótulo sai correto.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `BIGINT` | ID do Projeto | não | sem formatação | — |
| `tarefa_id` | `BIGINT` | ID da Tarefa | não | sem formatação | — |
| `hirearquia` | `VARCHAR` | Hierarquia | sim | guard Excel | — |
| `tarefa` | `VARCHAR` | Tarefa | sim | — | — |
| `inicio_planejado` | `DATE` | Início Planejado | sim | — | — |
| `termino_planejado` | `DATE` | Término Planejado | sim | — | — |
| `custo_estimado` | `VARCHAR` | Custo Estimado | sim | — | — |
| `duracao_planejado` | `INTEGER` | Duração Planejada (dias) | sim | sem formatação | — |
| `inicio_real` | `DATE` | Início Real | sim | — | — |
| `termino_real` | `DATE` | Término Real | sim | — | — |
| `duracao_real` | `INTEGER` | Duração Real (dias) | sim | sem formatação | — |
| `percentual_concluido` | `DOUBLE` | Percentual Concluído | sim | 2 casas, unidade `%` | — |
| `custo_real` | `VARCHAR` | Custo Real | sim | — | — |

## `RelTransferenciaCronogramaCsvRow`

Colunas do CSV bruto de `cronograma.csv`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `transferencia_id` | `BIGINT` | ID da Transferência | não | sem formatação | — |
| `hierarquia` | `VARCHAR` | Hierarquia | sim | guard Excel | — |
| `tarefa` | `VARCHAR` | Tarefa | sim | — | — |
| `inicio_planejado` | `DATE` | Início Planejado | sim | — | — |
| `termino_planejado` | `DATE` | Término Planejado | sim | — | — |
| `custo_estimado` | `DECIMAL(18,2)` | Custo Estimado | sim | R$, 2 casas | — |
| `duracao_planejado` | `INTEGER` | Duração Planejada | sim | sem formatação | — |

[← todos os arquivos](../report-columns.md)
