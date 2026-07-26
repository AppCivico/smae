# cronograma.csv

Linhas do cronograma (tarefas) das transferências filtradas.

Fontes que produzem este arquivo: `Transferencias`

7 colunas.

Classe de linha: `RelTransferenciaCronogramaCsvRow`

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
