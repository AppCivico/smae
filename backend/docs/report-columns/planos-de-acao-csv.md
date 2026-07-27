# planos_de_acao.csv

Uma linha por plano de ação (contramedida) dos riscos dos projetos filtrados.

Fontes que produzem este arquivo: `Projetos`

13 colunas.

Classe de linha: `RelProjetosPlanoAcaoCsvRow`

Nomes das tarefas afetadas, concatenados com `|`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `projeto_codigo` | `VARCHAR` | Código do Projeto | sim | — | — |
| `plano_acao_id` | `INTEGER` | ID do Plano de Ação | não | sem formatação | — |
| `risco_codigo` | `INTEGER` | Código do Risco | não | sem formatação | — |
| `contramedida` | `VARCHAR` | Contramedida | sim | — | — |
| `contramedida_texto` | `VARCHAR` | Contramedida Texto | sim | — | — |
| `medidas_de_contingencia` | `VARCHAR` | Medidas de Contingência | sim | — | — |
| `medidas_de_contingencia_texto` | `VARCHAR` | Medidas de Contingência Texto | sim | — | — |
| `prazo_contramedida` | `DATE` | Prazo da Contramedida | sim | — | — |
| `custo` | `DOUBLE` | Custo (R$) | sim | R$, 2 casas | — |
| `custo_percentual` | `DOUBLE` | Custo (%) | sim | 2 casas | — |
| `responsavel` | `VARCHAR` | Responsável | sim | — | — |
| `data_termino` | `DATE` | Data de Término | sim | — | — |

[← todos os arquivos](../report-columns.md)
