# parlamentares.csv

Uma linha por parlamentar, com o mandato e o partido atual (view_parlamentares_mandatos_part_atual).

Fontes que produzem este arquivo: `Parlamentares`

15 colunas.

Classe de linha: `RelParlamentaresCsvRow`

Colunas do CSV **bruto** de `parlamentares.csv`.

A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
quando nenhum modelo é aplicado. Ela reproduz o array `fields` que o relatório usava —
repare que ela **não** é a ordem das propriedades de `RelParlamentaresDto` (`ano_eleicao`
sai como 5ª coluna, logo depois da sigla do partido). O schema é plano (uma linha por
parlamentar/mandato), então nenhum nome precisa do `__` usado nos relatórios aninhados.

Regra geral: valores aqui são "compute store" — números como números, `null` para
ausência de valor, sem máscara e sem o hack de forçar texto no Excel. Rótulos e o guard
de texto são aplicados na etapa de pós-processamento.

Os rótulos abaixo reproduzem exatamente os cabeçalhos que o relatório já emitia hoje,
incluindo a capitalização irregular de 'Zona de atuação' (todos os demais usam Title
Case): mudar cabeçalho entregue ao usuário é decisão de negócio, não desta refatoração.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `id` | `INTEGER` | ID do Parlamentar | não | sem formatação | — |
| `nome_civil` | `VARCHAR` | Nome Civil | sim | — | — |
| `nome_parlamentar` | `VARCHAR` | Nome Parlamentar | sim | — | — |
| `partido_sigla` | `VARCHAR` | Sigla do Partido | sim | — | — |
| `ano_eleicao` | `INTEGER` | Ano da Eleição | sim | sem formatação | — |
| `cargo` | `VARCHAR` | Cargo | sim | — | — |
| `uf` | `VARCHAR` | UF | sim | — | — |
| `titular_suplente` | `VARCHAR` | Titular/Suplente/Efetivado | sim | — | — |
| `endereco` | `VARCHAR` | Endereço | sim | — | — |
| `gabinete` | `VARCHAR` | Gabinete | sim | — | — |
| `telefone` | `VARCHAR` | Telefone | sim | guard Excel | — |
| `dia_aniversario` | `INTEGER` | Dia Aniversário | sim | sem formatação | — |
| `mes_aniversario` | `INTEGER` | Mês Aniversário | sim | sem formatação | — |
| `email` | `VARCHAR` | E-mail | sim | — | — |
| `zona_atuacao` | `VARCHAR` | Zona de atuação | sim | — | — |

[← todos os arquivos](../report-columns.md)
