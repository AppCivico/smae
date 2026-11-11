# monitoramento-mensal-fases-ps.csv

Uma linha por meta, fase e bloco do monitoramento do ciclo, com a última revisão de cada fase. Fases sem blocos de texto (fases de tags) saem em uma linha só.

Fontes que produzem este arquivo: `PSMonitoramentoMensal`

17 colunas.

Classe de linha: `RelPsMonitoramentoMensalFasesCsvRow`

`monitoramento-mensal-fases-ps.csv`: uma linha por (meta, fase, bloco); fase sem bloco de texto (tags) sai em uma linha.

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `meta_id` | `BIGINT` | ID da Meta | sem formatação | — |
| `meta_codigo` | `VARCHAR` | Código da Meta | — | — |
| `meta_titulo` | `VARCHAR` | Título da Meta | — | — |
| `data_ciclo` | `DATE` | Data do Ciclo | — | — |
| `ciclo_fechado` | `VARCHAR` | Ciclo Fechado | — | — |
| `fase_ordem` | `INTEGER` | Ordem da Fase | sem formatação | — |
| `fase_rotulo` | `VARCHAR` | Fase | — | — |
| `bloco_ordem` | `INTEGER` | Ordem do Bloco | sem formatação | — |
| `bloco_rotulo` | `VARCHAR` | Bloco | — | — |
| `conteudo` | `VARCHAR` | Conteúdo | — | Conteúdo do bloco convertido de HTML para texto. |
| `revisao_id` | `BIGINT` | ID da Revisão | sem formatação | — |
| `referencia_data` | `DATE` | Data de Referência | — | — |
| `criado_em` | `TIMESTAMP` | Criado Em | — | — |
| `criador` | `VARCHAR` | Criador | — | — |
| `reaberto_em` | `TIMESTAMP` | Reaberto Em | — | — |
| `tags` | `VARCHAR` | Tags | — | Descrições separadas por "; ". |
| `documentos_qtde` | `INTEGER` | Quantidade de Documentos | sem formatação | — |

[← todos os arquivos](../report-columns.md)
