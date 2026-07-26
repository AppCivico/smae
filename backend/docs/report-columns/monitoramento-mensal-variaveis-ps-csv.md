# monitoramento-mensal-variaveis-ps.csv

Uma linha por série de variável (Previsto/Realizado/…) do ciclo mensal filtrado.

Fontes que produzem este arquivo: `PSMonitoramentoMensal`

23 colunas.

Classe de linha: `RelPsMonitoramentoMensalVariaveisCsvRow`

`monitoramento-mensal-variaveis-ps.csv` — uma linha por série de variável coletada no
mês/ano do filtro.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `codigo_indicador` | `VARCHAR` | Código do Indicador | sim | — | — |
| `titulo_indicador` | `VARCHAR` | Título do Indicador | sim | — | — |
| `indicador_id` | `BIGINT` | ID do Indicador | não | sem formatação | — |
| `codigo_variavel` | `VARCHAR` | Código da Variável | sim | — | — |
| `titulo_variavel` | `VARCHAR` | Título da Variável | sim | — | — |
| `variavel_id` | `BIGINT` | ID da Variável | não | sem formatação | — |
| `municipio` | `VARCHAR` | Município | sim | — | — |
| `municipio_id` | `BIGINT` | Código do Município | sim | sem formatação | — |
| `regiao` | `VARCHAR` | Região | sim | — | — |
| `regiao_id` | `BIGINT` | ID da Região | sim | sem formatação | — |
| `subprefeitura` | `VARCHAR` | Subprefeitura | sim | — | — |
| `subprefeitura_id` | `BIGINT` | ID da Subprefeitura | sim | sem formatação | — |
| `distrito` | `VARCHAR` | Distrito | sim | — | — |
| `distrito_id` | `BIGINT` | ID do Distrito | sim | sem formatação | — |
| `serie` | `VARCHAR` | Serie | sim | — | — |
| `data_referencia` | `DATE` | Data de Referencia | sim | — | — |
| `valor_nominal` | `DECIMAL(18,4)` | Valor Nominal | sim | 4 casas | — |
| `valor_categorica` | `VARCHAR` | Valor Categórica | sim | — | — |
| `eh_previa` | `VARCHAR` | É Prévia | sim | — | Sempre vazia nesta fonte: `eh_previa` só existe em `serie_indicador` (nível indicador), e esta consulta lê `serie_variavel`. Mantida pelo layout histórico. |
| `data_preenchimento` | `TIMESTAMP` | Data da Coleta | sim | — | — |
| `analise_qualitativa_coleta` | `VARCHAR` | Analise Qualitativa Coleta | sim | — | — |
| `analise_qualitativa_aprovador` | `VARCHAR` | Analise Qualitativa Conferidor | sim | — | — |
| `analise_qualitativa_liberador` | `VARCHAR` | Analise Qualitativa Liberador | sim | — | — |

[← todos os arquivos](../report-columns.md)
