# aditivos.csv

Uma linha por aditivo/reajuste dos contratos dos projetos filtrados.

Fontes que produzem este arquivo: `Projetos`

8 colunas.

Classe de linha: `RelProjetosAditivosCsvRow`

Já formatado por `f_formata_cnpj` — limpeza/máscara de domínio, feita no SQL.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `aditivo_id` | `INTEGER` | ID Aditivo | não | sem formatação | — |
| `contrato_id` | `INTEGER` | ID Contrato | não | sem formatação | — |
| `tipo_categoria` | `VARCHAR` | Categoria | sim | — | — |
| `tipo__nome` | `VARCHAR` | Tipo Aditivo | sim | — | — |
| `data` | `DATE` | Data | sim | — | — |
| `valor` | `DECIMAL(18,2)` | Valor | sim | R$, 2 casas | — |
| `percentual_medido` | `DECIMAL(18,4)` | % Execução | sim | 4 casas | — |
| `data_termino_atual` | `DATE` | Data Término Atual | sim | — | — |

[← todos os arquivos](../report-columns.md)
