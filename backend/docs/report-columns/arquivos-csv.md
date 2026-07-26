# arquivos.csv

Uma linha por documento anexado aos projetos filtrados.

Fontes que produzem este arquivo: `Projetos`

9 colunas.

Classe de linha: `RelProjetosArquivosCsvRow`

`Decimal(7,4)` no banco. O rótulo já traz o `%`, então não há `unit`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `projeto_codigo` | `VARCHAR` | Código do Projeto | sim | — | — |
| `nome_original` | `VARCHAR` | Nome Original | sim | — | — |
| `criado_em` | `TIMESTAMP` | Criado em | sim | — | — |
| `criador_id` | `INTEGER` | Criador (ID) | sim | sem formatação | — |
| `criador_nome_exibicao` | `VARCHAR` | Criador (Nome de Exibição) | sim | — | — |
| `caminho` | `VARCHAR` | Caminho no Object Storage | sim | — | — |
| `descricao` | `VARCHAR` | Descrição do Documento | sim | — | — |
| `arquivo_id` | `INTEGER` | ID do Arquivo | não | sem formatação | — |

[← todos os arquivos](../report-columns.md)
