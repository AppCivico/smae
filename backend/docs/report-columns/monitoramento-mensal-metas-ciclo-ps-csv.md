# monitoramento-mensal-metas-ciclo-ps.csv

Uma linha por meta do ciclo mensal, com análise qualitativa, risco e fechamento em texto puro.

Fontes que produzem este arquivo: `PSMonitoramentoMensal`

7 colunas.

Classe de linha: `RelPsMonitoramentoMensalMetasCicloCsvRow`

`monitoramento-mensal-metas-ciclo-ps.csv` — uma linha por meta do ciclo, com o resumo
(já convertido de HTML para texto) da análise qualitativa, do risco e do fechamento.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `meta_id` | `BIGINT` | ID da Meta | não | sem formatação | — |
| `meta_codigo` | `VARCHAR` | Código da Meta | sim | — | — |
| `analise_qualitativa` | `VARCHAR` | Analise Qualitativa | sim | — | — |
| `analise_qualitativa_data` | `DATE` | Data da Analise Qualitativa | sim | — | — |
| `risco_detalhamento` | `VARCHAR` | Detalhamento do Risco | sim | — | — |
| `risco_ponto_atencao` | `VARCHAR` | Ponto de Atenção do Risco | sim | — | — |
| `fechamento_comentario` | `VARCHAR` | Comentário de Fechamento | sim | — | — |

[← todos os arquivos](../report-columns.md)
