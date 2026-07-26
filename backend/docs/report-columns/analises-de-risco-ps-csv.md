# analises-de-risco-ps.csv

Uma linha por análise de risco de meta no ciclo mensal, com os textos em HTML e em texto puro.

Fontes que produzem este arquivo: `PSMonitoramentoMensal`

11 colunas.

Classe de linha: `RelPsMonitoramentoMensalRiscoCsvRow`

`analises-de-risco-ps.csv` — uma linha por análise de risco de meta do ciclo
(só as metas que têm risco entram).

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT` | ID | não | sem formatação | — |
| `criador_nome_exibicao` | `VARCHAR` | Criador | sim | — | — |
| `criado_em` | `TIMESTAMP` | Criado Em | sim | — | — |
| `detalhamento` | `VARCHAR` | Detalhamento | sim | — | — |
| `detalhamento_texto` | `VARCHAR` | Detalhamento (Texto) | sim | — | — |
| `ponto_de_atencao` | `VARCHAR` | Ponto de Atenção | sim | — | — |
| `ponto_de_atencao_texto` | `VARCHAR` | Ponto de Atenção (Texto) | sim | — | — |
| `referencia_data` | `DATE` | Data de Referência | sim | — | — |
| `meta_id` | `BIGINT` | ID da Meta | não | sem formatação | — |
| `meta_titulo` | `VARCHAR` | Título da Meta | sim | — | — |
| `meta_codigo` | `VARCHAR` | Código da Meta | sim | — | — |

[← todos os arquivos](../report-columns.md)
