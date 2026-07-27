# planejado.csv

Orçamento planejado. Uma linha por registro de orçamento planejado no Analítico, ou por dotação/ano agrupada no Consolidado. As colunas de meta/iniciativa/atividade só existem quando o relatório roda sobre um plano (sem plano, saem as colunas de projeto).

Fontes que produzem este arquivo: `PSOrcamento`, `ProjetoOrcamento`, `ObrasOrcamento`

27 colunas.

Classe de linha: `RelOrcamentoPlanejadoCsvRow`

Superconjunto das colunas de `planejado.csv`.

Mesmo bloco de meta/iniciativa/atividade/projeto do executado, sem as colunas de execução.
Ver o comentário de `fontes` em {@link RelOrcamentoExecutadoCsvRow}.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `ano` | `INTEGER` | ano | sim | sem formatação | Ano de referência do orçamento planejado. |
| `meta__codigo` | `VARCHAR` | Código da Meta | sim | — | — |
| `meta__titulo` | `VARCHAR` | Título da Meta | sim | — | — |
| `meta__id` | `INTEGER` | ID da Meta | não | sem formatação | — |
| `iniciativa__codigo` | `VARCHAR` | Código da Iniciativa | sim | — | — |
| `iniciativa__titulo` | `VARCHAR` | Título da Iniciativa | sim | — | — |
| `iniciativa__id` | `INTEGER` | ID da Iniciativa | não | sem formatação | — |
| `atividade__codigo` | `VARCHAR` | Código da Atividade | sim | — | — |
| `atividade__titulo` | `VARCHAR` | Título da Atividade | sim | — | — |
| `atividade__id` | `INTEGER` | ID da Atividade | não | sem formatação | — |
| `projeto__codigo` | `VARCHAR` | Código Projeto | sim | — | — |
| `projeto__nome` | `VARCHAR` | Nome do Projeto | sim | — | — |
| `projeto__id` | `INTEGER` | ID do Projeto | não | sem formatação | — |
| `dotacao` | `VARCHAR` | dotacao | sim | — | — |
| `orgao__codigo` | `VARCHAR` | orgao.codigo | sim | — | — |
| `orgao__nome` | `VARCHAR` | orgao.nome | sim | — | — |
| `unidade__codigo` | `VARCHAR` | unidade.codigo | sim | — | — |
| `unidade__nome` | `VARCHAR` | unidade.nome | sim | — | — |
| `fonte__codigo` | `VARCHAR` | fonte.codigo | sim | — | — |
| `fonte__nome` | `VARCHAR` | fonte.nome | sim | — | — |
| `acao_orcamentaria` | `VARCHAR` | acao_orcamentaria | sim | — | — |
| `plan_dotacao_sincronizado_em` | `VARCHAR` | plan_dotacao_sincronizado_em | sim | — | — |
| `plan_sof_val_orcado_atualizado` | `DECIMAL(18,2)` | plan_sof_val_orcado_atualizado | sim | — | — |
| `plan_valor_planejado` | `DECIMAL(18,2)` | plan_valor_planejado | sim | — | — |
| `plan_dotacao_ano_utilizado` | `INTEGER` | plan_dotacao_ano_utilizado | sim | sem formatação | — |
| `plan_dotacao_mes_utilizado` | `INTEGER` | plan_dotacao_mes_utilizado | sim | sem formatação | — |
| `logs` | `VARCHAR` | logs | sim | — | — |

[← todos os arquivos](../report-columns.md)
