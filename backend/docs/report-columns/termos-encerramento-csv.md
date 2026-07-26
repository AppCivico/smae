# termos_encerramento.csv

Uma linha por termo de encerramento (última versão) dos projetos filtrados.

Fontes que produzem este arquivo: `Projetos`

18 colunas.

Classe de linha: `RelProjetosTermoEncerramentoCsvRow`

`latitude,longitude` — texto, para não perder o par ao abrir na planilha.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `projeto_codigo` | `VARCHAR` | Código do Projeto | sim | — | — |
| `nome_projeto` | `VARCHAR` | Nome do Projeto | sim | — | — |
| `orgao_responsavel_nome` | `VARCHAR` | Órgão Responsável | sim | — | — |
| `portfolios_nomes` | `VARCHAR` | Portfólios | sim | — | — |
| `objeto` | `VARCHAR` | Objeto | sim | — | — |
| `previsao_inicio` | `DATE` | Previsão de Início | sim | — | — |
| `previsao_termino` | `DATE` | Previsão de Término | sim | — | — |
| `data_inicio_real` | `DATE` | Data de Início Real | sim | — | — |
| `data_termino_real` | `DATE` | Data de Término Real | sim | — | — |
| `previsao_custo` | `DOUBLE` | Previsão de Custo | sim | R$, 2 casas | — |
| `valor_executado_total` | `DOUBLE` | Valor Executado Total | sim | R$, 2 casas | — |
| `status_final` | `VARCHAR` | Status Final | sim | — | — |
| `etapa_nome` | `VARCHAR` | Etapa | sim | — | — |
| `justificativa` | `VARCHAR` | Justificativa | sim | — | — |
| `justificativa_complemento` | `VARCHAR` | Justificativa Complemento | sim | — | — |
| `responsavel_encerramento_nome` | `VARCHAR` | Responsável pelo Encerramento | sim | — | — |
| `data_encerramento` | `DATE` | Data de Encerramento | sim | — | — |

[← todos os arquivos](../report-columns.md)
