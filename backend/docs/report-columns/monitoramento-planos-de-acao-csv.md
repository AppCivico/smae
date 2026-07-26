# monitoramento_planos_de_acao.csv

Uma linha por aferição de monitoramento dos planos de ação.

Fontes que produzem este arquivo: `Projetos`

6 colunas.

Classe de linha: `RelProjetosPlanoAcaoMonitoramentoCsvRow`

Custo em relação ao projeto todo. O rótulo já traz o `%`, então não há `unit`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `projeto_codigo` | `VARCHAR` | Código Projeto | sim | — | — |
| `risco_codigo` | `INTEGER` | Código Risco | não | sem formatação | — |
| `plano_acao_id` | `INTEGER` | ID Plano de Ação | não | sem formatação | — |
| `data_afericao` | `DATE` | Data de aferição | sim | — | — |
| `descricao` | `VARCHAR` | Descrição | sim | — | — |

[← todos os arquivos](../report-columns.md)
