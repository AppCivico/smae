# contratos.csv

Uma linha por contrato vinculado à obra.
Contratos vinculados ao projeto.
Uma linha por contrato vinculado aos projetos filtrados.

Fontes que produzem este arquivo: `Obras`, `Projeto`, `Projetos`

35 colunas.

## `RelObrasContratosCsvRow`

Colunas do CSV bruto de `contratos.csv`.

A ordem reproduz exatamente o antigo array `contratosFields`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `contrato_id` | `BIGINT` | ID do Contrato | não | sem formatação | — |
| `obra_id` | `BIGINT` | ID da Obra | não | sem formatação | — |
| `numero` | `VARCHAR` | Número | sim | guard Excel | — |
| `exclusivo` | `BOOLEAN` | Exclusivo | sim | — | — |
| `status` | `VARCHAR` | Status | sim | — | — |
| `objeto` | `VARCHAR` | Objeto | sim | — | — |
| `descricao_detalhada` | `VARCHAR` | Descrição Detalhada | sim | — | — |
| `contratante` | `VARCHAR` | Contratante | sim | — | — |
| `empresa_contratada` | `VARCHAR` | Empresa Contratada | sim | — | — |
| `cnpj_contratada` | `VARCHAR` | CNPJ da Contratada | sim | guard Excel | — |
| `prazo` | `INTEGER` | Prazo | sim | sem formatação | — |
| `unidade_prazo` | `VARCHAR` | Unidade do Prazo | sim | — | — |
| `data_base` | `VARCHAR` | Data Base | sim | guard Excel | — |
| `data_inicio` | `DATE` | Data de Início | sim | — | — |
| `data_termino` | `DATE` | Data de Término | sim | — | — |
| `data_termino_atualizada` | `DATE` | Data de Término Atualizada | sim | — | — |
| `valor` | `DECIMAL(18,2)` | Valor | sim | R$, 2 casas | — |
| `observacoes` | `VARCHAR` | Observações | sim | — | — |
| `valor_contrato_atualizado` | `DECIMAL(18,2)` | Valor do Contrato Atualizado | sim | R$, 2 casas | — |
| `total_aditivos` | `DECIMAL(18,2)` | Total de Aditivos | sim | R$, 2 casas | — |
| `total_reajustes` | `DECIMAL(18,2)` | Total de Reajustes | sim | R$, 2 casas | — |
| `modalidade_contratacao_id` | `BIGINT` | ID da Modalidade de Contratação | sim | sem formatação | — |
| `modalidade_contratacao_nome` | `VARCHAR` | Modalidade de Contratação | sim | — | — |
| `orgao_id` | `BIGINT` | ID da Área Gestora | sim | sem formatação | — |
| `orgao_sigla` | `VARCHAR` | Sigla da Área Gestora | sim | — | — |
| `orgao_descricao` | `VARCHAR` | Área Gestora | sim | — | — |
| `percentual_medido` | `DECIMAL(18,4)` | Percentual Medido | sim | 2 casas | — |
| `processos_sei` | `VARCHAR` | Processos SEI | sim | guard Excel | — |
| `fontes_recurso` | `VARCHAR` | Fontes de Recurso | sim | guard Excel | — |

## `RelProjetoContratoCsvRow`

Colunas do CSV bruto de `contratos.csv` da fonte `Projeto` (uma linha por contrato).

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `contrato_id` | `BIGINT` | ID do Contrato | não | sem formatação | — |
| `projeto_id` | `BIGINT` | ID do Projeto | não | sem formatação | — |
| `numero` | `VARCHAR` | Número do Contrato | sim | guard Excel | — |
| `exclusivo` | `BOOLEAN` | Exclusivo | sim | — | — |
| `status` | `VARCHAR` | Status | sim | — | — |
| `objeto` | `VARCHAR` | Objeto | sim | — | — |
| `descricao_detalhada` | `VARCHAR` | Descrição Detalhada | sim | — | — |
| `contratante` | `VARCHAR` | Contratante | sim | — | — |
| `empresa_contratada` | `VARCHAR` | Empresa Contratada | sim | — | — |
| `prazo` | `INTEGER` | Prazo | sim | sem formatação | — |
| `unidade_prazo` | `VARCHAR` | Unidade do Prazo | sim | — | — |
| `data_base` | `VARCHAR` | Data Base | sim | guard Excel | — |
| `data_inicio` | `DATE` | Data de Início | sim | — | — |
| `data_termino` | `DATE` | Data de Término | sim | — | — |
| `data_termino_atualizada` | `DATE` | Data de Término Atualizada | sim | — | — |
| `valor` | `DECIMAL(18,2)` | Valor | sim | R$, 2 casas | — |
| `observacoes` | `VARCHAR` | Observações | sim | — | — |
| `valor_contrato_atualizado` | `DECIMAL(18,2)` | Valor do Contrato Atualizado | sim | R$, 2 casas | — |
| `total_aditivos` | `DECIMAL(18,2)` | Total de Aditivos | sim | R$, 2 casas | — |
| `total_reajustes` | `DECIMAL(18,2)` | Total de Reajustes | sim | R$, 2 casas | — |
| `modalidade_licitacao__id` | `BIGINT` | Modalidade de Licitação - ID | sim | sem formatação | — |
| `modalidade_licitacao__nome` | `VARCHAR` | Modalidade de Licitação | sim | — | — |
| `area_gestora__id` | `BIGINT` | Área Gestora - ID | sim | sem formatação | — |
| `area_gestora__sigla` | `VARCHAR` | Área Gestora (Sigla) | sim | — | — |
| `area_gestora__descricao` | `VARCHAR` | Área Gestora | sim | — | — |
| `percentual_medido` | `DECIMAL(18,4)` | Percentual Medido | sim | 2 casas, unidade `%` | — |
| `processos_sei` | `VARCHAR` | Processos SEI | sim | guard Excel | — |
| `fontes_recurso` | `VARCHAR` | Fontes de Recurso | sim | guard Excel | — |
| `cnpj_contratada` | `VARCHAR` | CNPJ da Contratada | sim | guard Excel | — |

## `RelProjetosContratosCsvRow`

Códigos dos riscos associados ao acompanhamento, concatenados com `|`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `contrato_id` | `INTEGER` | contrato_id | não | sem formatação | — |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `numero` | `VARCHAR` | Número | sim | — | — |
| `exclusivo` | `BOOLEAN` | Exclusivo | sim | — | — |
| `status` | `VARCHAR` | Status | sim | — | — |
| `objeto` | `VARCHAR` | Objeto | sim | — | — |
| `descricao_detalhada` | `VARCHAR` | Descrição Detalhada | sim | — | — |
| `contratante` | `VARCHAR` | Contratante | sim | — | — |
| `empresa_contratada` | `VARCHAR` | Empresa Contratada | sim | — | — |
| `prazo` | `INTEGER` | Prazo | sim | sem formatação | — |
| `unidade_prazo` | `VARCHAR` | Unidade Prazo | sim | — | — |
| `data_base` | `VARCHAR` | Data-base | sim | — | — |
| `data_inicio` | `DATE` | Data Início | sim | — | — |
| `data_termino` | `DATE` | Data Término | sim | — | — |
| `data_termino_atualizada` | `DATE` | Data Término Atualizada | sim | — | — |
| `valor` | `DECIMAL(18,2)` | Valor | sim | R$, 2 casas | — |
| `observacoes` | `VARCHAR` | Observações | sim | — | — |
| `valor_contrato_atualizado` | `DECIMAL(18,2)` | Valor Contrato Atualizado | sim | R$, 2 casas | — |
| `total_aditivos` | `DECIMAL(18,2)` | Total Aditivos | sim | R$, 2 casas | — |
| `total_reajustes` | `DECIMAL(18,2)` | Total Reajustes | sim | R$, 2 casas | — |
| `modalidade_licitacao__id` | `INTEGER` | Modalidade de Licitação - ID | sim | sem formatação | — |
| `modalidade_licitacao__nome` | `VARCHAR` | Modalidade de Licitação - Nome | sim | — | — |
| `area_gestora__id` | `INTEGER` | Área Gestora - ID | sim | sem formatação | — |
| `area_gestora__sigla` | `VARCHAR` | Área Gestora - Sigla | sim | — | — |
| `area_gestora__descricao` | `VARCHAR` | Área Gestora - Descrição | sim | — | — |
| `percentual_medido` | `DECIMAL(18,4)` | Máximo % Execução | sim | 4 casas | — |
| `processos_sei` | `VARCHAR` | Processos SEI | sim | — | — |
| `fontes_recurso` | `VARCHAR` | Fontes de Recurso | sim | — | — |
| `cnpj_contratada` | `VARCHAR` | CNPJ Contratada | sim | — | — |

[← todos os arquivos](../report-columns.md)
