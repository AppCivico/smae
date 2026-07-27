# riscos.csv

Riscos registrados no projeto.
Uma linha por risco registrado nos projetos filtrados.

Fontes que produzem este arquivo: `Projeto`, `Projetos`

20 colunas.

## `RelProjetoRiscoCsvRow`

Colunas do CSV bruto de `riscos.csv` (uma linha por risco do projeto).

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `risco_id` | `BIGINT` | ID do Risco | não | sem formatação | — |
| `codigo` | `INTEGER` | Código | sim | sem formatação | — |
| `titulo` | `VARCHAR` | Título | sim | — | — |
| `descricao` | `VARCHAR` | Descrição | sim | — | — |
| `probabilidade` | `INTEGER` | Probabilidade | sim | sem formatação | — |
| `probabilidade_descricao` | `VARCHAR` | Descrição da Probabilidade | sim | — | — |
| `impacto` | `INTEGER` | Impacto | sim | sem formatação | — |
| `impacto_descricao` | `VARCHAR` | Descrição do Impacto | sim | — | — |
| `grau` | `INTEGER` | Grau | sim | sem formatação | — |
| `grau_descricao` | `VARCHAR` | Descrição do Grau | sim | — | — |
| `status` | `VARCHAR` | Status | sim | — | — |

## `RelProjetosRiscosCsvRow`

`hierarquia sigla latência` por dependência, concatenadas com `/`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `projeto_codigo` | `VARCHAR` | Código do Projeto | sim | — | — |
| `codigo` | `INTEGER` | Código | não | sem formatação | — |
| `titulo` | `VARCHAR` | Título | sim | — | — |
| `data_registro` | `DATE` | Data de Registro | sim | — | — |
| `status_risco` | `VARCHAR` | Status do Risco | sim | — | — |
| `descricao` | `VARCHAR` | Descrição | sim | — | — |
| `causa` | `VARCHAR` | Causa | sim | — | — |
| `consequencia` | `VARCHAR` | Consequência | sim | — | — |
| `probabilidade` | `INTEGER` | Probabilidade | sim | sem formatação | — |
| `probabilidade_descricao` | `VARCHAR` | Descrição da Probabilidade | sim | — | — |
| `impacto` | `INTEGER` | Impacto | sim | sem formatação | — |
| `impacto_descricao` | `VARCHAR` | Descrição do Impacto | sim | — | — |
| `nivel` | `INTEGER` | Nível | sim | sem formatação | — |
| `grau` | `INTEGER` | Grau | sim | sem formatação | — |
| `grau_descricao` | `VARCHAR` | Descrição do Grau | sim | — | — |
| `resposta` | `VARCHAR` | Resposta | sim | — | — |
| `tarefas_afetadas` | `VARCHAR` | Tarefas Afetadas | sim | — | — |

[← todos os arquivos](../report-columns.md)
