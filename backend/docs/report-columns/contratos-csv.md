# contratos.csv

Uma linha por contrato vinculado aos projetos filtrados.

Fontes que produzem este arquivo: `Projetos`

29 colunas.

Classe de linha: `RelProjetosContratosCsvRow`

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
