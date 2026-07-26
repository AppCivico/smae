# acompanhamentos.csv

Uma linha por item de acompanhamento das obras (acompanhamento × item, via LEFT JOIN 1:N).

Fontes que produzem este arquivo: `Obras`

18 colunas.

Classe de linha: `RelObrasAcompanhamentosCsvRow`

Colunas do CSV bruto de `acompanhamentos.csv`.

A ordem reproduz exatamente o antigo array `acompanhamentosFields`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | ID da Obra | não | sem formatação | — |
| `obra_codigo` | `VARCHAR` | Código da Obra | sim | guard Excel | — |
| `data_registro` | `DATE` | Data do Registro | sim | — | — |
| `participantes` | `VARCHAR` | Participantes | sim | — | — |
| `cronograma_paralizado` | `BOOLEAN` | Cronograma Paralisado | sim | — | — |
| `prazo_encaminhamento` | `DATE` | Prazo do Encaminhamento | sim | — | — |
| `pauta` | `VARCHAR` | Pauta | sim | — | — |
| `pauta_texto` | `VARCHAR` | Pauta (texto) | sim | — | — |
| `prazo_realizado` | `DATE` | Prazo Realizado | sim | — | — |
| `detalhamento` | `VARCHAR` | Detalhamento | sim | — | — |
| `detalhamento_texto` | `VARCHAR` | Detalhamento (texto) | sim | — | — |
| `encaminhamento` | `VARCHAR` | Encaminhamento | sim | — | — |
| `responsavel` | `VARCHAR` | Responsável | sim | — | — |
| `observacao` | `VARCHAR` | Observação | sim | — | — |
| `detalhamento_status` | `VARCHAR` | Detalhamento do Status | sim | — | — |
| `pontos_atencao` | `VARCHAR` | Pontos de Atenção | sim | — | — |
| `pontos_atencao_texto` | `VARCHAR` | Pontos de Atenção (texto) | sim | — | — |
| `riscos` | `VARCHAR` | Riscos | sim | — | — |

[← todos os arquivos](../report-columns.md)
