# cronograma.csv

Uma linha por tarefa do cronograma dos projetos filtrados.
Linhas do cronograma (tarefas) das transferências filtradas.

Fontes que produzem este arquivo: `Projetos`, `Transferencias`

21 colunas.

## `RelProjetosCronogramaCsvRow`

Código SOF: identificador, fica `VARCHAR` para não perder zeros à esquerda.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `projeto_codigo` | `VARCHAR` | Código do Projeto | sim | — | — |
| `tarefa_id` | `INTEGER` | ID da Tarefa | não | sem formatação | — |
| `hierarquia` | `VARCHAR` | Hierarquia | sim | — | — |
| `numero` | `INTEGER` | Número | sim | sem formatação | — |
| `nivel` | `INTEGER` | Nível | sim | sem formatação | — |
| `tarefa` | `VARCHAR` | Tarefa | sim | — | — |
| `inicio_planejado` | `DATE` | Início Planejado | sim | — | — |
| `termino_planejado` | `DATE` | Término Planejado | sim | — | — |
| `custo_estimado` | `VARCHAR` | Custo Estimado | sim | — | — |
| `inicio_real` | `DATE` | Início Real | sim | — | — |
| `termino_real` | `DATE` | Término Real | sim | — | — |
| `duracao_real` | `INTEGER` | Duração Real (dias) | sim | sem formatação | — |
| `percentual_concluido` | `DOUBLE` | % Concluído | sim | 2 casas | — |
| `custo_real` | `VARCHAR` | Custo Real | sim | — | — |
| `dependencias` | `VARCHAR` | Dependências | sim | — | — |
| `atraso` | `INTEGER` | Atraso (dias) | sim | sem formatação | — |
| `responsavel__id` | `INTEGER` | ID do Responsável | sim | sem formatação | — |
| `responsavel__nome_exibicao` | `VARCHAR` | Nome do Responsável | sim | — | — |

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
