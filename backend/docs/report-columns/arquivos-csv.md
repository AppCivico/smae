# arquivos.csv

Uma linha por documento anexado à obra.

Fontes que produzem este arquivo: `Obras`

9 colunas.

Classe de linha: `RelObrasArquivosCsvRow`

Colunas do CSV bruto de `arquivos.csv`.

Ordem do `SELECT` de `_queryDataArquivos()` — sem `fields` explícito.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | ID da Obra | não | sem formatação | — |
| `obra_codigo` | `VARCHAR` | Código da Obra | sim | guard Excel | — |
| `nome_original` | `VARCHAR` | Nome do Arquivo | sim | — | — |
| `criado_em` | `TIMESTAMP` | Criado em | sim | — | — |
| `criador_id` | `BIGINT` | ID do Criador | sim | sem formatação | — |
| `criador_nome_exibicao` | `VARCHAR` | Criador | sim | — | — |
| `caminho` | `VARCHAR` | Caminho | sim | — | — |
| `descricao` | `VARCHAR` | Descrição | sim | — | — |
| `arquivo_id` | `BIGINT` | ID do Arquivo | não | sem formatação | — |

[← todos os arquivos](../report-columns.md)
