# fechamentos-ps.csv

Uma linha por fechamento de meta no ciclo mensal.

Fontes que produzem este arquivo: `PSMonitoramentoMensal`

8 colunas.

Classe de linha: `RelPsMonitoramentoMensalFechamentoCsvRow`

`fechamentos-ps.csv` — uma linha por fechamento de meta do ciclo
(só as metas que têm fechamento entram).

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT` | ID | não | sem formatação | — |
| `criador_nome_exibicao` | `VARCHAR` | Criador | sim | — | — |
| `criado_em` | `TIMESTAMP` | Criado Em | sim | — | — |
| `comentario` | `VARCHAR` | Comentário | sim | — | — |
| `referencia_data` | `DATE` | Data de Referência | sim | — | — |
| `meta_id` | `BIGINT` | ID da Meta | não | sem formatação | — |
| `meta_titulo` | `VARCHAR` | Título da Meta | sim | — | — |
| `meta_codigo` | `VARCHAR` | Código da Meta | sim | — | — |

[← todos os arquivos](../report-columns.md)
