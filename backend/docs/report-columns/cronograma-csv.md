# cronograma.csv

Uma linha por tarefa do cronograma das obras filtradas.
Linhas do cronograma (tarefas) das transferências filtradas.

Fontes que produzem este arquivo: `Obras`, `Transferencias`

21 colunas.

## `RelObrasCronogramaCsvRow`

Colunas do CSV bruto de `cronograma.csv` das obras.

Mesmo nome de arquivo do `cronograma.csv` de `Transferencias` — isso é esperado e não
conflita: `describeSchema` devolve só os schemas da execução corrente e `findFileSchema`
casa por nome dentro dessa lista.

A ordem reproduz exatamente o antigo array `cronogramaFields`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | ID da Obra | não | sem formatação | — |
| `obra_codigo` | `VARCHAR` | Código da Obra | sim | guard Excel | — |
| `tarefa_id` | `BIGINT` | ID da Tarefa | não | sem formatação | — |
| `hierarquia` | `VARCHAR` | Hierarquia | sim | guard Excel | — |
| `numero` | `INTEGER` | Número | sim | sem formatação | — |
| `nivel` | `INTEGER` | Nível | sim | sem formatação | — |
| `tarefa` | `VARCHAR` | Tarefa | sim | — | — |
| `inicio_planejado` | `DATE` | Início Planejado | sim | — | — |
| `termino_planejado` | `DATE` | Término Planejado | sim | — | — |
| `custo_estimado` | `VARCHAR` | Custo Estimado | sim | — | — |
| `inicio_real` | `DATE` | Início Real | sim | — | — |
| `termino_real` | `DATE` | Término Real | sim | — | — |
| `duracao_real` | `INTEGER` | Duração Real | sim | sem formatação | — |
| `percentual_concluido` | `DOUBLE` | Percentual Concluído | sim | 2 casas | — |
| `custo_real` | `VARCHAR` | Custo Real | sim | — | — |
| `dependencias` | `VARCHAR` | Dependências | sim | — | — |
| `atraso` | `INTEGER` | Atraso (dias) | sim | sem formatação | — |
| `responsavel_id` | `BIGINT` | ID do Responsável | sim | sem formatação | — |
| `responsavel_nome_exibicao` | `VARCHAR` | Responsável | sim | — | — |

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
