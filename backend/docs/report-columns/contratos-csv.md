# contratos.csv

Uma linha por contrato vinculado à obra.
Contratos vinculados ao projeto.
Uma linha por contrato vinculado aos projetos filtrados.

Fontes que produzem este arquivo: `Obras`, `Projeto`, `Projetos`

36 colunas.

## `RelObrasContratosCsvRow`

Colunas do CSV bruto de `contratos.csv`.

A ordem reproduz exatamente o antigo array `contratosFields`.

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `contrato_id` | `BIGINT` | contrato_id | sem formatação | — |
| `obra_id` | `BIGINT` | obra_id | sem formatação | — |
| `numero` | `VARCHAR` | numero | — | — |
| `exclusivo` | `BOOLEAN` | exclusivo | — | — |
| `status` | `VARCHAR` | status | — | — |
| `objeto` | `VARCHAR` | objeto | — | — |
| `descricao_detalhada` | `VARCHAR` | descricao_detalhada | — | — |
| `contratante` | `VARCHAR` | contratante | — | — |
| `empresa_contratada` | `VARCHAR` | empresa_contratada | — | — |
| `cnpj_contratada` | `VARCHAR` | cnpj_contratada | — | — |
| `prazo` | `INTEGER` | prazo | sem formatação | — |
| `unidade_prazo` | `VARCHAR` | unidade_prazo | — | — |
| `data_base` | `VARCHAR` | data_base | — | — |
| `data_assinatura` | `DATE` | data_assinatura | — | — |
| `data_inicio` | `DATE` | data_inicio | — | — |
| `data_termino` | `DATE` | data_termino | — | — |
| `data_termino_atualizada` | `DATE` | data_termino_atualizada | — | — |
| `valor` | `DECIMAL(18,2)` | valor | R$, 2 casas | — |
| `observacoes` | `VARCHAR` | observacoes | — | — |
| `valor_contrato_atualizado` | `DECIMAL(18,2)` | valor_contrato_atualizado | R$, 2 casas | — |
| `total_aditivos` | `DECIMAL(18,2)` | total_aditivos | R$, 2 casas | — |
| `total_reajustes` | `DECIMAL(18,2)` | total_reajustes | R$, 2 casas | — |
| `modalidade_contratacao_id` | `BIGINT` | modalidade_contratacao_id | sem formatação | — |
| `modalidade_contratacao_nome` | `VARCHAR` | modalidade_contratacao_nome | — | — |
| `orgao_id` | `BIGINT` | orgao_id | sem formatação | — |
| `orgao_sigla` | `VARCHAR` | orgao_sigla | — | — |
| `orgao_descricao` | `VARCHAR` | orgao_descricao | — | — |
| `percentual_medido` | `DECIMAL(18,4)` | percentual_medido | 2 casas | — |
| `processos_sei` | `VARCHAR` | processos_sei | — | — |
| `fontes_recurso` | `VARCHAR` | fontes_recurso | — | — |

## `RelProjetoContratoCsvRow`

Colunas do CSV bruto de `contratos.csv` da fonte `Projeto` (uma linha por contrato).

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `contrato_id` | `BIGINT` | contrato_id | sem formatação | — |
| `projeto_id` | `BIGINT` | projeto_id | sem formatação | — |
| `numero` | `VARCHAR` | numero | — | — |
| `exclusivo` | `BOOLEAN` | exclusivo | — | — |
| `status` | `VARCHAR` | status | — | — |
| `objeto` | `VARCHAR` | objeto | — | — |
| `descricao_detalhada` | `VARCHAR` | descricao_detalhada | — | — |
| `contratante` | `VARCHAR` | contratante | — | — |
| `empresa_contratada` | `VARCHAR` | empresa_contratada | — | — |
| `prazo` | `INTEGER` | prazo | sem formatação | — |
| `unidade_prazo` | `VARCHAR` | unidade_prazo | — | — |
| `data_base` | `VARCHAR` | data_base | — | — |
| `data_assinatura` | `DATE` | data_assinatura | — | — |
| `data_inicio` | `DATE` | data_inicio | — | — |
| `data_termino` | `DATE` | data_termino | — | — |
| `data_termino_atualizada` | `DATE` | data_termino_atualizada | — | — |
| `valor` | `DECIMAL(18,2)` | valor | R$, 2 casas | — |
| `observacoes` | `VARCHAR` | observacoes | — | — |
| `valor_contrato_atualizado` | `DECIMAL(18,2)` | valor_contrato_atualizado | R$, 2 casas | — |
| `total_aditivos` | `DECIMAL(18,2)` | total_aditivos | R$, 2 casas | — |
| `total_reajustes` | `DECIMAL(18,2)` | total_reajustes | R$, 2 casas | — |
| `modalidade_licitacao__id` | `BIGINT` | modalidade_licitacao.id | sem formatação | — |
| `modalidade_licitacao__nome` | `VARCHAR` | modalidade_licitacao.nome | — | — |
| `area_gestora__id` | `BIGINT` | area_gestora.id | sem formatação | — |
| `area_gestora__sigla` | `VARCHAR` | area_gestora.sigla | — | — |
| `area_gestora__descricao` | `VARCHAR` | area_gestora.descricao | — | — |
| `percentual_medido` | `DECIMAL(18,4)` | percentual_medido | 2 casas, unidade `%` | — |
| `processos_sei` | `VARCHAR` | processos_sei | — | — |
| `fontes_recurso` | `VARCHAR` | fontes_recurso | — | — |
| `cnpj_contratada` | `VARCHAR` | cnpj_contratada | — | — |

## `RelProjetosContratosCsvRow`

Códigos dos riscos associados ao acompanhamento, concatenados com `|`.

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `contrato_id` | `INTEGER` | contrato_id | sem formatação | — |
| `projeto_id` | `INTEGER` | ID Projeto | sem formatação | — |
| `numero` | `VARCHAR` | Número | — | — |
| `exclusivo` | `BOOLEAN` | Exclusivo | — | — |
| `status` | `VARCHAR` | Status | — | — |
| `objeto` | `VARCHAR` | Objeto | — | — |
| `descricao_detalhada` | `VARCHAR` | Descrição Detalhada | — | — |
| `contratante` | `VARCHAR` | Contratante | — | — |
| `empresa_contratada` | `VARCHAR` | Empresa Contratada | — | — |
| `prazo` | `INTEGER` | Prazo | sem formatação | — |
| `unidade_prazo` | `VARCHAR` | Unidade Prazo | — | — |
| `data_base` | `VARCHAR` | Data-base | — | — |
| `data_assinatura` | `DATE` | Data Assinatura | — | — |
| `data_inicio` | `DATE` | Data Início | — | — |
| `data_termino` | `DATE` | Data Término | — | — |
| `data_termino_atualizada` | `DATE` | Data Término Atualizada | — | — |
| `valor` | `DECIMAL(18,2)` | Valor | R$, 2 casas | — |
| `observacoes` | `VARCHAR` | Observações | — | — |
| `valor_contrato_atualizado` | `DECIMAL(18,2)` | Valor Contrato Atualizado | R$, 2 casas | — |
| `total_aditivos` | `DECIMAL(18,2)` | Total Aditivos | R$, 2 casas | — |
| `total_reajustes` | `DECIMAL(18,2)` | Total Reajustes | R$, 2 casas | — |
| `modalidade_licitacao__id` | `INTEGER` | Modalidade de Licitação - ID | sem formatação | — |
| `modalidade_licitacao__nome` | `VARCHAR` | Modalidade de Licitação - Nome | — | — |
| `area_gestora__id` | `INTEGER` | Área Gestora - ID | sem formatação | — |
| `area_gestora__sigla` | `VARCHAR` | Área Gestora - Sigla | — | — |
| `area_gestora__descricao` | `VARCHAR` | Área Gestora - Descrição | — | — |
| `percentual_medido` | `DECIMAL(18,4)` | Máximo % Execução | 4 casas | — |
| `processos_sei` | `VARCHAR` | Processos SEI | — | — |
| `fontes_recurso` | `VARCHAR` | Fontes de Recurso | — | — |
| `cnpj_contratada` | `VARCHAR` | CNPJ Contratada | — | — |

[← todos os arquivos](../report-columns.md)
