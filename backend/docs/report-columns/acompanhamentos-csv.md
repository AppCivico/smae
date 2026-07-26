# acompanhamentos.csv

Uma linha por item de acompanhamento (o acompanhamento se repete quando tem mais de um encaminhamento).

Fontes que produzem este arquivo: `Projetos`

18 colunas.

Classe de linha: `RelProjetosAcompanhamentosCsvRow`

Custo em relação ao projeto todo. O rótulo já traz o `%`, então não há `unit`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `projeto_codigo` | `VARCHAR` | Código do Projeto | sim | — | — |
| `data_registro` | `DATE` | Data do Registro | sim | — | — |
| `participantes` | `VARCHAR` | Participantes | sim | — | — |
| `cronograma_paralizado` | `BOOLEAN` | Cronograma Paralisado | sim | — | — |
| `prazo_encaminhamento` | `DATE` | Prazo de Encaminhamento | sim | — | — |
| `pauta` | `VARCHAR` | Pauta | sim | — | — |
| `pauta_texto` | `VARCHAR` | Pauta Texto | sim | — | — |
| `prazo_realizado` | `DATE` | Prazo Realizado | sim | — | — |
| `detalhamento` | `VARCHAR` | Detalhamento | sim | — | — |
| `detalhamento_texto` | `VARCHAR` | Detalhamento Texto | sim | — | — |
| `encaminhamento` | `VARCHAR` | Encaminhamento | sim | — | — |
| `responsavel` | `VARCHAR` | Responsável | sim | — | — |
| `observacao` | `VARCHAR` | Observação | sim | — | — |
| `detalhamento_status` | `VARCHAR` | Status Detalhado | sim | — | — |
| `pontos_atencao` | `VARCHAR` | Pontos de Atenção | sim | — | — |
| `pontos_atencao_texto` | `VARCHAR` | Pontos de Atenção Texto | sim | — | — |
| `riscos` | `VARCHAR` | Códigos dos Riscos | sim | — | — |

[← todos os arquivos](../report-columns.md)
