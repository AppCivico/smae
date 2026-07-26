# acompanhamentos.csv

Acompanhamentos registrados no projeto.

Fontes que produzem este arquivo: `Projeto`

16 colunas.

Classe de linha: `RelProjetoAcompanhamentoCsvRow`

Colunas do CSV bruto de `acompanhamentos.csv` (uma linha por acompanhamento do projeto).

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `acompanhamento_id` | `BIGINT` | ID do Acompanhamento | não | sem formatação | — |
| `projeto_id` | `BIGINT` | ID do Projeto | não | sem formatação | — |
| `acompanhamento_tipo` | `VARCHAR` | Tipo de Acompanhamento | sim | — | — |
| `numero` | `INTEGER` | Número | sim | sem formatação | — |
| `data_registro` | `DATE` | Data do Registro | sim | — | — |
| `participantes` | `VARCHAR` | Participantes | sim | — | — |
| `detalhamento` | `VARCHAR` | Detalhamento | sim | — | — |
| `observacao` | `VARCHAR` | Observação | sim | — | — |
| `detalhamento_status` | `VARCHAR` | Detalhamento do Status | sim | — | — |
| `pontos_atencao` | `VARCHAR` | Pontos de Atenção | sim | — | — |
| `pauta` | `VARCHAR` | Pauta | sim | — | — |
| `cronograma_paralisado` | `BOOLEAN` | Cronograma Paralisado | sim | — | — |
| `riscos` | `VARCHAR` | Riscos | sim | — | — |
| `pauta_texto` | `VARCHAR` | Pauta (texto) | sim | — | — |
| `detalhamento_texto` | `VARCHAR` | Detalhamento (texto) | sim | — | — |
| `pontos_atencao_texto` | `VARCHAR` | Pontos de Atenção (texto) | sim | — | — |

[← todos os arquivos](../report-columns.md)
