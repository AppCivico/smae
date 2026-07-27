# demandas.csv

Uma linha por demanda, com os dados de responsável, projeto, valor e área temática.

Fontes que produzem este arquivo: `Demandas`

18 colunas.

Classe de linha: `RelDemandasCsvRow`

Colunas do CSV **bruto** de `demandas.csv`.

A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
quando nenhum modelo é aplicado. O schema é plano (uma linha por demanda), então nenhum
nome precisa do `__` usado nos relatórios aninhados.

Regra geral: valores aqui são "compute store" — números como números, datas em ISO
(`YYYY-MM-DD`), sem máscara de moeda e sem o hack `="valor"`. Moeda, separador decimal,
`dd/mm/aaaa` e o guard de texto do Excel são aplicados na etapa de pós-processamento.

`status` e `finalidade` saem com o valor cru do enum do Prisma (`DemandaStatus` /
`DemandaFinalidade`), exatamente como o relatório já fazia — não existe hoje tradução
humana desses valores e inventá-la aqui mudaria o conteúdo entregue.

Todas as colunas de texto levam `excelTextGuard` porque a extração antiga envolvia
**todo** campo string em `="..."` (`formatExcelString`); o guard no schema é o que
reproduz esse comportamento agora que a extração emite o valor cru.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT` | ID | não | sem formatação | — |
| `status` | `VARCHAR` | Status | sim | — | — |
| `data_registro` | `DATE` | Data de Registro | sim | — | — |
| `data_publicado` | `DATE` | Data de Publicação | sim | — | — |
| `orgao_gestor` | `VARCHAR` | Gestor Municipal | sim | guard Excel | — |
| `unidade_responsavel` | `VARCHAR` | Unidade Responsável | sim | guard Excel | — |
| `nome_responsavel` | `VARCHAR` | Nome do Responsável | sim | guard Excel | — |
| `cargo_responsavel` | `VARCHAR` | Cargo do Responsável | sim | guard Excel | — |
| `email_responsavel` | `VARCHAR` | E-mail do Responsável | sim | guard Excel | — |
| `telefone_responsavel` | `VARCHAR` | Telefone do Responsável | sim | guard Excel | — |
| `nome_projeto` | `VARCHAR` | Nome do Projeto | sim | guard Excel | — |
| `descricao` | `VARCHAR` | Descrição | sim | guard Excel | — |
| `justificativa` | `VARCHAR` | Justificativa | sim | guard Excel | — |
| `valor` | `DECIMAL(18,2)` | Valor | sim | R$, 2 casas | — |
| `finalidade` | `VARCHAR` | Finalidade | sim | — | — |
| `observacao` | `VARCHAR` | Observação | sim | guard Excel | — |
| `area_tematica` | `VARCHAR` | Área Temática | sim | guard Excel | — |
| `acoes` | `VARCHAR` | Ação | sim | guard Excel | — |

[← todos os arquivos](../report-columns.md)
