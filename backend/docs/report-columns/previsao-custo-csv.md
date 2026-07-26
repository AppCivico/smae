# previsao-custo.csv

Uma linha por orçamento previsto (última revisão) do ano de referência, com o recorte de Meta/Iniciativa/Atividade.
Uma linha por orçamento previsto (última revisão) do ano de referência, com o recorte de Projeto/Obra.

Fontes que produzem este arquivo: `PSPrevisaoCusto`, `ProjetoPrevisaoCusto`, `ObrasPrevisaoCusto`

20 colunas.

## `RelPrevisaoCustoPdmCsvRow`

Variante com PDM: as três primeiras colunas descrevem Meta / Iniciativa / Atividade.

Os rótulos de iniciativa e atividade são configuráveis por PDM (`rotulo_iniciativa` /
`rotulo_atividade`). Aqui ficam os padrões do banco ("Iniciativa"/"Atividade"); o
`describeSchema()` do serviço sobrescreve com os rótulos do PDM da execução, reproduzindo
o `'Código da ' + pdm.rotulo_iniciativa` que a extração montava antes.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `meta__codigo` | `VARCHAR` | Código da Meta | sim | — | — |
| `meta__titulo` | `VARCHAR` | Título da Meta | sim | — | — |
| `meta__id` | `BIGINT` | ID da Meta | não | sem formatação | — |
| `iniciativa__codigo` | `VARCHAR` | Código da Iniciativa | sim | — | — |
| `iniciativa__titulo` | `VARCHAR` | Título da Iniciativa | sim | — | — |
| `iniciativa__id` | `BIGINT` | ID da Iniciativa | não | sem formatação | — |
| `atividade__codigo` | `VARCHAR` | Código da Atividade | sim | — | — |
| `atividade__titulo` | `VARCHAR` | Título da Atividade | sim | — | — |
| `atividade__id` | `BIGINT` | ID da Atividade | não | sem formatação | — |
| `id` | `BIGINT` | id | não | sem formatação | — |
| `versao_anterior_id` | `BIGINT` | id_versao_anterior | não | sem formatação | ID da revisão anterior deste orçamento previsto (vazio na primeira versão). |
| `projeto_atividade` | `VARCHAR` | projeto_atividade | sim | — | — |
| `criado_em` | `TIMESTAMP` | criado_em | sim | — | — |
| `ano_referencia` | `INTEGER` | ano_referencia | sim | sem formatação | — |
| `custo_previsto` | `DECIMAL(18,2)` | custo_previsto | sim | 2 casas | — |
| `parte_dotacao` | `VARCHAR` | parte_dotacao | sim | — | — |
| `atualizado_em` | `TIMESTAMP` | atualizado_em | sim | — | — |

## `RelPrevisaoCustoProjetoCsvRow`

Variante sem PDM (Portfólio de Projetos / Obras): as três primeiras colunas descrevem o
Projeto. As demais são idênticas às da variante de PDM.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto__codigo` | `VARCHAR` | Código Projeto | sim | — | — |
| `projeto__nome` | `VARCHAR` | Nome do Projeto | sim | — | — |
| `projeto__id` | `BIGINT` | ID do Projeto | não | sem formatação | — |
| `id` | `BIGINT` | id | não | sem formatação | — |
| `versao_anterior_id` | `BIGINT` | id_versao_anterior | não | sem formatação | ID da revisão anterior deste orçamento previsto (vazio na primeira versão). |
| `projeto_atividade` | `VARCHAR` | projeto_atividade | sim | — | — |
| `criado_em` | `TIMESTAMP` | criado_em | sim | — | — |
| `ano_referencia` | `INTEGER` | ano_referencia | sim | sem formatação | — |
| `custo_previsto` | `DECIMAL(18,2)` | custo_previsto | sim | 2 casas | — |
| `parte_dotacao` | `VARCHAR` | parte_dotacao | sim | — | — |
| `atualizado_em` | `TIMESTAMP` | atualizado_em | sim | — | — |

[← todos os arquivos](../report-columns.md)
