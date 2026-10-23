# obras.csv

Uma linha por combinação de obra × fonte de recurso × órgão participante (efeito dos LEFT JOINs 1:N).

Fontes que produzem este arquivo: `Obras`

75 colunas.

Classe de linha: `RelObrasCsvRow`

Colunas do CSV bruto de `obras.csv`.

As colunas seguem exatamente a ordem do `SELECT` de `buildObrasBaseQuery()` — era dele
que o cabeçalho nascia, já que este arquivo nunca passou uma lista `fields` explícita.

Uma obra pode aparecer em mais de uma linha: a consulta faz `LEFT JOIN` com
`projeto_fonte_recurso` e `projeto_orgao_participante`, que são 1:N. Uma linha por obra:
`obras_simplificado.csv` (`RelObrasSimplificadoCsvRow`).

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | obra_id | sem formatação | — |
| `codigo` | `VARCHAR` | codigo | — | — |
| `portfolio_id` | `BIGINT` | portfolio_id | sem formatação | — |
| `nome` | `VARCHAR` | nome | — | — |
| `portfolio_titulo` | `VARCHAR` | portfolio_titulo | — | — |
| `etiquetas` | `VARCHAR` | etiquetas | — | — |
| `status` | `VARCHAR` | status | — | — |
| `projeto_etapa` | `VARCHAR` | projeto_etapa | — | — |
| `grupos_observadores` | `VARCHAR` | grupos_observadores | — | — |
| `mdo_observacoes` | `VARCHAR` | mdo_observacoes | — | — |
| `inicio_planejado` | `DATE` | inicio_planejado | — | — |
| `termino_planejado` | `DATE` | termino_planejado | — | — |
| `previsao_inicio` | `DATE` | previsao_inicio | — | — |
| `previsao_termino` | `DATE` | previsao_termino | — | — |
| `previsao_duracao` | `INTEGER` | previsao_duracao | sem formatação | — |
| `previsao_custo` | `DECIMAL(18,2)` | previsao_custo | R$, 2 casas | — |
| `custo_planejado` | `DECIMAL(18,2)` | custo_planejado | R$, 2 casas | — |
| `objeto` | `VARCHAR` | objeto | — | — |
| `objetivo` | `VARCHAR` | objetivo | — | — |
| `escopo` | `VARCHAR` | escopo | — | — |
| `nao_escopo` | `VARCHAR` | nao_escopo | — | — |
| `grupo_tematico_id` | `BIGINT` | grupo_tematico_id | sem formatação | — |
| `grupo_tematico_nome` | `VARCHAR` | grupo_tematico_nome | — | — |
| `tipo_intervencao_id` | `BIGINT` | tipo_intervencao_id | sem formatação | — |
| `tipo_intervencao_nome` | `VARCHAR` | tipo_intervencao_nome | — | — |
| `tipo_intervencao_conceito` | `VARCHAR` | tipo_intervencao_conceito | — | — |
| `equipamento_id` | `BIGINT` | equipamento_id | sem formatação | — |
| `equipamento_nome` | `VARCHAR` | equipamento_nome | — | — |
| `orgao_responsavel_id` | `BIGINT` | orgao_responsavel_id | sem formatação | — |
| `orgao_responsavel_sigla` | `VARCHAR` | orgao_responsavel_sigla | — | — |
| `orgao_responsavel_descricao` | `VARCHAR` | orgao_responsavel_descricao | — | — |
| `responsavel_id` | `BIGINT` | responsavel_id | sem formatação | — |
| `responsavel_nome_exibicao` | `VARCHAR` | responsavel_nome_exibicao | — | — |
| `orgao_gestor_id` | `BIGINT` | orgao_gestor_id | sem formatação | — |
| `orgao_gestor_sigla` | `VARCHAR` | orgao_gestor_sigla | — | — |
| `orgao_gestor_descricao` | `VARCHAR` | orgao_gestor_descricao | — | — |
| `orgao_id` | `BIGINT` | orgao_id | sem formatação | — |
| `orgao_sigla` | `VARCHAR` | orgao_sigla | — | — |
| `orgao_descricao` | `VARCHAR` | orgao_descricao | — | — |
| `orgao_executor_id` | `BIGINT` | orgao_executor_id | sem formatação | — |
| `orgao_executor_sigla` | `VARCHAR` | orgao_executor_sigla | — | — |
| `orgao_executor_descricao` | `VARCHAR` | orgao_executor_descricao | — | — |
| `orgao_origem_id` | `BIGINT` | orgao_origem_id | sem formatação | — |
| `orgao_origem_sigla` | `VARCHAR` | orgao_origem_sigla | — | — |
| `orgao_origem_descricao` | `VARCHAR` | orgao_origem_descricao | — | — |
| `orgao_colaborador_id` | `BIGINT` | orgao_colaborador_id | sem formatação | — |
| `orgao_colaborador_sigla` | `VARCHAR` | orgao_colaborador_sigla | — | — |
| `orgao_colaborador_descricao` | `VARCHAR` | orgao_colaborador_descricao | — | — |
| `meta_id` | `BIGINT` | meta_id | sem formatação | — |
| `meta_nome` | `VARCHAR` | meta_nome | — | — |
| `pdm_id` | `BIGINT` | pdm_id | sem formatação | — |
| `pdm_nome` | `VARCHAR` | pdm_nome | — | — |
| `assessores` | `VARCHAR` | assessores | — | — |
| `pontos_focais_colaboradores` | `VARCHAR` | pontos_focais_colaboradores | — | — |
| `fonte_recurso_valor_pct` | `DOUBLE` | fonte_recurso_valor_pct | 2 casas | — |
| `fonte_recurso_valor_nominal` | `DECIMAL(18,2)` | fonte_recurso_valor_nominal | R$, 2 casas | — |
| `detalhamento` | `VARCHAR` | detalhamento | — | — |
| `origem_tipo` | `VARCHAR` | origem_tipo | — | — |
| `descricao` | `VARCHAR` | descricao | — | — |
| `secretario_colaborador` | `VARCHAR` | secretario_colaborador | — | — |
| `data_inauguracao_planejada` | `DATE` | data_inauguracao_planejada | — | — |
| `subprefeituras` | `VARCHAR` | subprefeituras | — | — |
| `programa_habitacional` | `VARCHAR` | programa_habitacional | — | — |
| `empreendimento_id` | `BIGINT` | empreendimento_id | sem formatação | — |
| `empreendimento_identificador` | `VARCHAR` | empreendimento_identificador | — | — |
| `portfolios_compartilhados_titulos` | `VARCHAR` | portfolios_compartilhados_titulos | — | — |
| `secretario_responsavel` | `VARCHAR` | secretario_responsavel | — | — |
| `secretario_executivo` | `VARCHAR` | secretario_executivo | — | — |
| `coordenador_ue` | `VARCHAR` | coordenador_ue | — | — |
| `data_aprovacao` | `DATE` | data_aprovacao | — | — |
| `data_revisao` | `DATE` | data_revisao | — | — |
| `versao` | `VARCHAR` | versao | — | — |
| `n_unidades_habitacionais` | `INTEGER` | n_unidades_habitacionais | sem formatação | — |
| `n_familias_beneficiadas` | `INTEGER` | n_familias_beneficiadas | sem formatação | — |
| `n_unidades_atendidas` | `INTEGER` | n_unidades_atendidas | sem formatação | — |

[← todos os arquivos](../report-columns.md)
