# executado.csv

Orçamento executado (realizado). Uma linha por item de orçamento realizado no Analítico, ou por dotação/processo/nota agrupada no Consolidado. As colunas de ano/mês só existem no Analítico e as de meta/iniciativa/atividade só existem quando o relatório roda sobre um plano (sem plano, saem as colunas de projeto).

Fontes que produzem este arquivo: `PSOrcamento`, `ProjetoOrcamento`, `ObrasOrcamento`

40 colunas.

Classe de linha: `RelOrcamentoExecutadoCsvRow`

Superconjunto das colunas de `executado.csv`.

`fontes` lista apenas as três fontes ativas. A fonte `Orcamento` (PDM antigo) usa o **mesmo**
service e continua passando por este schema em tempo de execução — ela só ficou de fora da
listagem porque está sendo descontinuada e não deve aparecer como customizável na API.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `mes` | `INTEGER` | mês | sim | sem formatação | — |
| `ano` | `INTEGER` | ano | sim | sem formatação | — |
| `mes_corrente` | `VARCHAR` | mês corrente | sim | — | — |
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
| `processo` | `VARCHAR` | processo | sim | — | — |
| `nota_empenho` | `VARCHAR` | nota_empenho | sim | — | — |
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
| `dotacao_sincronizado_em` | `VARCHAR` | dotacao_sincronizado_em | sim | — | — |
| `dotacao_valor_empenhado` | `DECIMAL(18,2)` | dotacao_valor_empenhado | sim | — | — |
| `dotacao_valor_liquidado` | `DECIMAL(18,2)` | dotacao_valor_liquidado | sim | — | — |
| `dotacao_ano_utilizado` | `INTEGER` | dotacao_ano_utilizado | sim | sem formatação | — |
| `dotacao_mes_utilizado` | `INTEGER` | dotacao_mes_utilizado | sim | sem formatação | — |
| `smae_valor_empenhado` | `DECIMAL(18,2)` | smae_valor_empenhado | sim | — | — |
| `smae_valor_liquidado` | `DECIMAL(18,2)` | smae_valor_liquidado | sim | — | — |
| `smae_percentual_empenhado` | `VARCHAR` | smae_percentual_empenhado | sim | — | Percentual empenhado apurado pelo SMAE (`smae_percentual_empenho` no DTO). |
| `smae_percentual_liquidado` | `VARCHAR` | smae_percentual_liquidado | sim | — | — |
| `logs` | `VARCHAR` | logs | sim | — | — |

[← todos os arquivos](../report-columns.md)
