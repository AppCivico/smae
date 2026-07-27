# obras.csv

Uma linha por combinação de obra × fonte de recurso × órgão participante (efeito dos LEFT JOINs 1:N).

Fontes que produzem este arquivo: `Obras`

74 colunas.

Classe de linha: `RelObrasCsvRow`

Colunas do CSV bruto de `obras.csv`.

As colunas seguem exatamente a ordem do `SELECT` de `buildObrasBaseQuery()` — era dele
que o cabeçalho nascia, já que este arquivo nunca passou uma lista `fields` explícita.

Uma obra pode aparecer em mais de uma linha: a consulta faz `LEFT JOIN` com
`projeto_fonte_recurso` e `projeto_orgao_participante`, que são 1:N.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | ID da Obra | não | sem formatação | — |
| `codigo` | `VARCHAR` | Código | sim | guard Excel | — |
| `portfolio_id` | `BIGINT` | ID do Portfólio | não | sem formatação | — |
| `nome` | `VARCHAR` | Nome | sim | — | — |
| `portfolio_titulo` | `VARCHAR` | Portfólio | sim | — | — |
| `etiquetas` | `VARCHAR` | Etiquetas | sim | — | — |
| `status` | `VARCHAR` | Status | sim | — | — |
| `projeto_etapa` | `VARCHAR` | Etapa | sim | — | — |
| `inicio_planejado` | `DATE` | Início Planejado | sim | — | — |
| `termino_planejado` | `DATE` | Término Planejado | sim | — | — |
| `previsao_inicio` | `DATE` | Previsão de Início | sim | — | — |
| `previsao_termino` | `DATE` | Previsão de Término | sim | — | — |
| `previsao_duracao` | `INTEGER` | Previsão de Duração | sim | sem formatação | — |
| `previsao_custo` | `DECIMAL(18,2)` | Previsão de Custo | sim | R$, 2 casas | — |
| `custo_planejado` | `DECIMAL(18,2)` | Custo Planejado | sim | R$, 2 casas | — |
| `objeto` | `VARCHAR` | Objeto | sim | — | — |
| `objetivo` | `VARCHAR` | Objetivo | sim | — | — |
| `escopo` | `VARCHAR` | Escopo | sim | — | — |
| `nao_escopo` | `VARCHAR` | Não Escopo | sim | — | — |
| `grupo_tematico_id` | `BIGINT` | ID do Grupo Temático | sim | sem formatação | — |
| `grupo_tematico_nome` | `VARCHAR` | Grupo Temático | sim | — | — |
| `tipo_intervencao_id` | `BIGINT` | ID do Tipo de Intervenção | sim | sem formatação | — |
| `tipo_intervencao_nome` | `VARCHAR` | Tipo de Intervenção | sim | — | — |
| `tipo_intervencao_conceito` | `VARCHAR` | Conceito do Tipo de Intervenção | sim | — | — |
| `equipamento_id` | `BIGINT` | ID do Equipamento | sim | sem formatação | — |
| `equipamento_nome` | `VARCHAR` | Equipamento | sim | — | — |
| `orgao_responsavel_id` | `BIGINT` | ID do Órgão Responsável | sim | sem formatação | — |
| `orgao_responsavel_sigla` | `VARCHAR` | Sigla do Órgão Responsável | sim | — | — |
| `orgao_responsavel_descricao` | `VARCHAR` | Órgão Responsável | sim | — | — |
| `responsavel_id` | `BIGINT` | ID do Responsável | sim | sem formatação | — |
| `responsavel_nome_exibicao` | `VARCHAR` | Responsável | sim | — | — |
| `orgao_gestor_id` | `BIGINT` | ID do Órgão Gestor | sim | sem formatação | — |
| `orgao_gestor_sigla` | `VARCHAR` | Sigla do Órgão Gestor | sim | — | — |
| `orgao_gestor_descricao` | `VARCHAR` | Órgão Gestor | sim | — | — |
| `orgao_id` | `BIGINT` | ID do Órgão Participante | sim | sem formatação | — |
| `orgao_sigla` | `VARCHAR` | Sigla do Órgão Participante | sim | — | — |
| `orgao_descricao` | `VARCHAR` | Órgão Participante | sim | — | — |
| `orgao_executor_id` | `BIGINT` | ID do Órgão Executor | sim | sem formatação | — |
| `orgao_executor_sigla` | `VARCHAR` | Sigla do Órgão Executor | sim | — | — |
| `orgao_executor_descricao` | `VARCHAR` | Órgão Executor | sim | — | — |
| `orgao_origem_id` | `BIGINT` | ID do Órgão de Origem | sim | sem formatação | — |
| `orgao_origem_sigla` | `VARCHAR` | Sigla do Órgão de Origem | sim | — | — |
| `orgao_origem_descricao` | `VARCHAR` | Órgão de Origem | sim | — | — |
| `orgao_colaborador_id` | `BIGINT` | ID do Órgão Colaborador | sim | sem formatação | — |
| `orgao_colaborador_sigla` | `VARCHAR` | Sigla do Órgão Colaborador | sim | — | — |
| `orgao_colaborador_descricao` | `VARCHAR` | Órgão Colaborador | sim | — | — |
| `meta_id` | `BIGINT` | ID da Meta | sim | sem formatação | — |
| `meta_nome` | `VARCHAR` | Meta | sim | — | — |
| `pdm_id` | `BIGINT` | ID do Programa de Metas | sim | sem formatação | — |
| `pdm_nome` | `VARCHAR` | Programa de Metas | sim | — | — |
| `assessores` | `VARCHAR` | Assessores | sim | — | — |
| `pontos_focais_colaboradores` | `VARCHAR` | Pontos Focais Colaboradores | sim | — | — |
| `fonte_recurso_valor_pct` | `DOUBLE` | Fonte de Recurso - Percentual | sim | 2 casas | — |
| `fonte_recurso_valor_nominal` | `DECIMAL(18,2)` | Fonte de Recurso - Valor Nominal | sim | R$, 2 casas | — |
| `detalhamento` | `VARCHAR` | Detalhamento | sim | — | — |
| `origem_tipo` | `VARCHAR` | Tipo de Origem | sim | — | — |
| `descricao` | `VARCHAR` | Descrição da Origem | sim | — | — |
| `secretario_colaborador` | `VARCHAR` | Secretário Colaborador | sim | — | — |
| `data_inauguracao_planejada` | `DATE` | Data de Inauguração Planejada | sim | — | — |
| `subprefeituras` | `VARCHAR` | Subprefeituras | sim | — | — |
| `programa_habitacional` | `VARCHAR` | Programa Habitacional | sim | — | — |
| `empreendimento_id` | `BIGINT` | ID do Empreendimento | sim | sem formatação | — |
| `empreendimento_identificador` | `VARCHAR` | Identificador do Empreendimento | sim | guard Excel | — |
| `mdo_observacoes` | `VARCHAR` | Observações | sim | — | — |
| `portfolios_compartilhados_titulos` | `VARCHAR` | Portfólios Compartilhados | sim | — | — |
| `secretario_responsavel` | `VARCHAR` | Secretário Responsável | sim | — | — |
| `secretario_executivo` | `VARCHAR` | Secretário Executivo | sim | — | — |
| `coordenador_ue` | `VARCHAR` | Coordenador da Unidade Executora | sim | — | — |
| `data_aprovacao` | `DATE` | Data de Aprovação | sim | — | — |
| `data_revisao` | `DATE` | Data de Revisão | sim | — | — |
| `versao` | `VARCHAR` | Versão | sim | guard Excel | — |
| `n_unidades_habitacionais` | `INTEGER` | Nº de Unidades Habitacionais | sim | sem formatação | — |
| `n_familias_beneficiadas` | `INTEGER` | Nº de Famílias Beneficiadas | sim | sem formatação | — |
| `n_unidades_atendidas` | `INTEGER` | Nº de Unidades Atendidas | sim | sem formatação | — |

[← todos os arquivos](../report-columns.md)
