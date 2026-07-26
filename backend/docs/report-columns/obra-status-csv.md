# obra-status.csv

Uma linha por obra do portfólio, com o status do cronograma e o último acompanhamento.

Fontes que produzem este arquivo: `ObraStatus`

11 colunas.

Classe de linha: `RelObraStatusCsvRow`

O nome do arquivo depende de `params.tipo_pdm` (`projeto-status.csv` para `PP`,
`obra-status.csv` caso contrário), e `@ReportRows.arquivo` é estático — daí duas classes.
As colunas são idênticas entre as duas variantes, então ficam declaradas uma única vez na
base: `getReportRowSchema` percorre a cadeia de protótipos e herda as colunas do pai.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `id` | `INTEGER` | ID | não | sem formatação | — |
| `portfolio_id` | `INTEGER` | ID do Portfólio | não | sem formatação | — |
| `codigo` | `VARCHAR` | Código | sim | — | — |
| `nome` | `VARCHAR` | Nome | sim | — | — |
| `previsao_custo` | `DOUBLE` | Previsão de Custo | sim | R$, 2 casas | — |
| `realizado_custo` | `DOUBLE` | Custo Realizado | sim | R$, 2 casas | — |
| `cronograma` | `VARCHAR` | Cronograma | sim | — | — |
| `orgao_responsavel_sigla` | `VARCHAR` | Órgão Responsável | sim | — | — |
| `detalhamento` | `VARCHAR` | Detalhamento | sim | — | — |
| `pontos_atencao` | `VARCHAR` | Pontos de Atenção | sim | — | — |
| `tarefas` | `VARCHAR` | Tarefas | sim | — | — |

[← todos os arquivos](../report-columns.md)
