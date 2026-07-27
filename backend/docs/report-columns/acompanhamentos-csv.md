# acompanhamentos.csv

Uma linha por item de acompanhamento das obras (acompanhamento × item, via LEFT JOIN 1:N).
Acompanhamentos registrados no projeto.
Uma linha por item de acompanhamento (o acompanhamento se repete quando tem mais de um encaminhamento).

Fontes que produzem este arquivo: `Obras`, `Projeto`, `Projetos`

24 colunas.

## `RelObrasAcompanhamentosCsvRow`

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

## `RelProjetoAcompanhamentoCsvRow`

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

## `RelProjetosAcompanhamentosCsvRow`

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
