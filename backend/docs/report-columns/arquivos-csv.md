# arquivos.csv

Documentos anexados ao projeto.

Fontes que produzem este arquivo: `Projeto`

7 colunas.

Classe de linha: `RelProjetoArquivoCsvRow`

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

[← todos os arquivos](../report-columns.md)
