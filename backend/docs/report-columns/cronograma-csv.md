# cronograma.csv

Uma linha por tarefa do cronograma das obras filtradas.
Linhas do cronograma (tarefas) do projeto.
Uma linha por tarefa do cronograma dos projetos filtrados.
Linhas do cronograma (tarefas) das transferências filtradas.

Fontes que produzem este arquivo: `Obras`, `Projeto`, `Projetos`, `Transferencias`

25 colunas.

## `RelObrasCronogramaCsvRow`

Colunas do CSV bruto de `cronograma.csv` das obras.

Mesmo nome de arquivo do `cronograma.csv` de `Transferencias` — isso é esperado e não
conflita: `describeSchema` devolve só os schemas da execução corrente e `findFileSchema`
casa por nome dentro dessa lista.

A ordem reproduz exatamente o antigo array `cronogramaFields`.

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | obra_id | sem formatação | — |
| `obra_codigo` | `VARCHAR` | obra_codigo | — | — |
| `tarefa_id` | `BIGINT` | tarefa_id | sem formatação | — |
| `hierarquia` | `VARCHAR` | hierarquia | — | — |
| `numero` | `INTEGER` | numero | sem formatação | — |
| `nivel` | `INTEGER` | nivel | sem formatação | — |
| `tarefa` | `VARCHAR` | tarefa | — | — |
| `inicio_planejado` | `DATE` | inicio_planejado | — | — |
| `termino_planejado` | `DATE` | termino_planejado | — | — |
| `custo_estimado` | `VARCHAR` | custo_estimado | — | — |
| `inicio_real` | `DATE` | inicio_real | — | — |
| `termino_real` | `DATE` | termino_real | — | — |
| `duracao_real` | `INTEGER` | duracao_real | sem formatação | — |
| `percentual_concluido` | `DOUBLE` | percentual_concluido | 2 casas | — |
| `custo_real` | `VARCHAR` | custo_real | — | — |
| `dependencias` | `VARCHAR` | dependencias | — | — |
| `atraso` | `INTEGER` | atraso | sem formatação | — |
| `responsavel_id` | `BIGINT` | responsavel_id | sem formatação | — |
| `responsavel_nome_exibicao` | `VARCHAR` | responsavel_nome_exibicao | — | — |

## `RelProjetoCronogramaCsvRow`

Colunas do CSV bruto de `cronograma.csv` da fonte `Projeto` (uma linha por tarefa).

A coluna de numeração hierárquica saía como `hirearquia` — typo herdado do nome da
propriedade no DTO `RelProjetoCronogramaDto`. No CSV o nome foi corrigido para
`hierarquia`, que é como o mesmo arquivo já sai nas fontes `Obras`, `Projetos` e
`Transferencias`; o cabeçalho antigo não é mais emitido. No DTO da API
(`POST /relatorio/projeto`) o campo com typo continua existindo, marcado como deprecado
e ao lado do `hierarquia` correto, porque ali remover quebraria o contrato.

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `projeto_id` | `BIGINT` | projeto_id | sem formatação | — |
| `tarefa_id` | `BIGINT` | tarefa_id | sem formatação | — |
| `hierarquia` | `VARCHAR` | hierarquia | — | — |
| `tarefa` | `VARCHAR` | tarefa | — | — |
| `inicio_planejado` | `DATE` | inicio_planejado | — | — |
| `termino_planejado` | `DATE` | termino_planejado | — | — |
| `custo_estimado` | `VARCHAR` | custo_estimado | — | — |
| `duracao_planejado` | `INTEGER` | duracao_planejado | sem formatação | — |
| `inicio_real` | `DATE` | inicio_real | — | — |
| `termino_real` | `DATE` | termino_real | — | — |
| `duracao_real` | `INTEGER` | duracao_real | sem formatação | — |
| `percentual_concluido` | `DOUBLE` | percentual_concluido | 2 casas, unidade `%` | — |
| `custo_real` | `VARCHAR` | custo_real | — | — |

## `RelProjetosCronogramaCsvRow`

Colunas do CSV bruto de `cronograma.csv` dos projetos.

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | sem formatação | — |
| `projeto_codigo` | `VARCHAR` | Código do Projeto | — | — |
| `tarefa_id` | `INTEGER` | ID da Tarefa | sem formatação | — |
| `hierarquia` | `VARCHAR` | Hierarquia | — | — |
| `numero` | `INTEGER` | Número | sem formatação | — |
| `nivel` | `INTEGER` | Nível | sem formatação | — |
| `tarefa` | `VARCHAR` | Tarefa | — | — |
| `inicio_planejado` | `DATE` | Início Planejado | — | — |
| `termino_planejado` | `DATE` | Término Planejado | — | — |
| `custo_estimado` | `VARCHAR` | Custo Estimado | — | — |
| `inicio_real` | `DATE` | Início Real | — | — |
| `termino_real` | `DATE` | Término Real | — | — |
| `duracao_real` | `INTEGER` | Duração Real (dias) | sem formatação | — |
| `percentual_concluido` | `DOUBLE` | % Concluído | 2 casas | — |
| `custo_real` | `VARCHAR` | Custo Real | — | — |
| `dependencias` | `VARCHAR` | Dependências | — | — |
| `atraso` | `INTEGER` | Atraso (dias) | sem formatação | — |
| `responsavel__id` | `INTEGER` | ID do Responsável | sem formatação | — |
| `responsavel__nome_exibicao` | `VARCHAR` | Nome do Responsável | — | — |

## `RelTransferenciaCronogramaCsvRow`

Colunas do CSV bruto de `cronograma.csv`.

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `transferencia_id` | `BIGINT` | ID da Transferência | sem formatação | — |
| `hierarquia` | `VARCHAR` | Hierarquia | — | — |
| `tarefa` | `VARCHAR` | Tarefa | — | — |
| `inicio_planejado` | `DATE` | Início Planejado | — | — |
| `termino_planejado` | `DATE` | Término Planejado | — | — |
| `custo_estimado` | `DECIMAL(18,2)` | Custo Estimado | R$, 2 casas | — |
| `duracao_planejado` | `INTEGER` | Duração Planejada | sem formatação | — |

[← todos os arquivos](../report-columns.md)
