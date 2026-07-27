# arquivos.csv

Uma linha por documento anexado à obra.
Documentos anexados ao projeto.
Uma linha por documento anexado aos projetos filtrados.

Fontes que produzem este arquivo: `Obras`, `Projeto`, `Projetos`

16 colunas.

## `RelObrasArquivosCsvRow`

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

## `RelProjetoArquivoCsvRow`

Colunas do CSV bruto de `arquivos.csv` (uma linha por documento anexado ao projeto).

Este arquivo já tinha `fields` explícito: os rótulos abaixo são **byte-a-byte** os que o
relatório emite hoje, incluindo `descricao do Documento` (sem acento e com "do Documento"
em maiúscula) e `ID do arquivo` — corrigir rótulo entregue ao usuário é decisão de negócio.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `arquivo__nome_original` | `VARCHAR` | Nome Original | sim | — | — |
| `criado_em` | `TIMESTAMP` | Criado em | sim | — | — |
| `criador__id` | `BIGINT` | Criador (ID) | não | sem formatação | — |
| `criador__nome_exibicao` | `VARCHAR` | Criador (Nome de Exibição) | sim | — | — |
| `arquivo__caminho` | `VARCHAR` | Caminho no Object Storage | sim | — | — |
| `descricao` | `VARCHAR` | descricao do Documento | sim | — | — |
| `arquivo__id` | `BIGINT` | ID do arquivo | não | sem formatação | — |

## `RelProjetosArquivosCsvRow`

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
