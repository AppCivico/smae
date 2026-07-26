# projetos.csv

Uma linha por combinação de projeto × órgão participante × premissa × restrição × fonte de recurso (o SQL faz LEFT JOIN em todas elas, então um projeto pode aparecer em várias linhas).

Fontes que produzem este arquivo: `Projetos`

50 colunas.

Classe de linha: `RelProjetosCsvRow`

Colunas dos CSVs **brutos** do relatório de portfólio (fonte `Projetos`).

São treze arquivos, um por bloco de dados do portfólio. Cada classe abaixo corresponde a
um arquivo e a ordem de declaração das propriedades é a ordem das colunas — ela reproduz
exatamente o array `<bloco>Fields` que existia no `toFileOutput`, e cada `label` é
byte-a-byte o rótulo do `<bloco>FieldNames` correspondente.

Regra geral: os valores aqui são "compute store" — números como números, datas em ISO
(`YYYY-MM-DD`) e `null` para ausência de valor. Separador decimal pt-BR, `dd/mm/aaaa` e
máscara de moeda são aplicados na etapa de pós-processamento.

## Nomes com `__`

Vários campos vinham de objetos aninhados do DTO e apareciam no `fields` como
`orgao_responsavel.id`, `fonte_recurso.valor_nominal`, `premissa.id`... O builder DuckDB
trata `.` como referência qualificada por fonte, então o `flatten()` do json2csv passou a
usar `__` como separador (veja `ppProjetosTransforms`, declarada junto com estas classes) e os
nomes de máquina abaixo acompanham. O rótulo entregue ao usuário não mudou.

O `flatten` roda com `arrays: false` (padrão do json2csv): campo array vira **uma** célula
serializada, nunca N colunas. É isso que mantém o conjunto de colunas fixo mesmo com a
extração em lotes (`processDataInBatches`).

## Guard do Excel

Nenhuma coluna recebe `excelTextGuard`. A extração deste relatório nunca emitiu `="..."`
em campo nenhum — ligar o guard mudaria os bytes do arquivo para quem consome o CSV
programaticamente. Manter a equivalência com a saída de hoje vale mais do que corrigir a
interpretação do Excel numa refatoração de infraestrutura.

## Tipos

`INTEGER` para as colunas `Int` do Postgres, `DOUBLE` para as `Float` (não há precisão
exata a preservar) e `DECIMAL(18,2)` / `DECIMAL(18,4)` para as `Decimal` de contrato e
aditivo — o `Decimal` do Prisma é serializado como string pelo json2csv, então a precisão
chega intacta no DuckDB.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `codigo` | `VARCHAR` | Código | sim | — | — |
| `portfolio_id` | `INTEGER` | ID Portfólio | não | sem formatação | — |
| `nome` | `VARCHAR` | Nome do Projeto | sim | — | — |
| `portfolio_titulo` | `VARCHAR` | Título do Portfólio | sim | — | — |
| `etiquetas` | `VARCHAR` | Etiquetas | sim | — | — |
| `status` | `VARCHAR` | Status (Banco) | sim | — | — |
| `projeto_etapa` | `VARCHAR` | Projeto Etapa | sim | — | — |
| `previsao_inicio` | `DATE` | Previsão de Início | sim | — | — |
| `previsao_termino` | `DATE` | Previsão de Término | sim | — | — |
| `previsao_duracao` | `INTEGER` | Previsão de Duração | sim | sem formatação | — |
| `previsao_custo` | `DOUBLE` | Previsão de Custo | sim | R$, 2 casas | — |
| `objeto` | `VARCHAR` | Objeto | sim | — | — |
| `objetivo` | `VARCHAR` | Objetivo | sim | — | — |
| `escopo` | `VARCHAR` | Escopo | sim | — | — |
| `nao_escopo` | `VARCHAR` | Não Escopo | sim | — | — |
| `orgao_responsavel__id` | `INTEGER` | ID Órgão Responsável | sim | sem formatação | — |
| `orgao_responsavel__sigla` | `VARCHAR` | Sigla Órgão Responsável | sim | — | — |
| `orgao_responsavel__descricao` | `VARCHAR` | Descrição Órgão Responsável | sim | — | — |
| `responsavel__id` | `INTEGER` | ID Responsável | sim | sem formatação | — |
| `responsavel__nome_exibicao` | `VARCHAR` | Nome do Responsável | sim | — | — |
| `orgao_gestor__id` | `INTEGER` | ID Órgão Gestor | sim | sem formatação | — |
| `orgao_gestor__sigla` | `VARCHAR` | Sigla Órgão Gestor | sim | — | — |
| `orgao_gestor__descricao` | `VARCHAR` | Descrição Órgão Gestor | sim | — | — |
| `orgao_participante__id` | `INTEGER` | ID Órgão Participante | sim | sem formatação | — |
| `orgao_participante__sigla` | `VARCHAR` | Sigla Órgão Participante | sim | — | — |
| `orgao_participante__descricao` | `VARCHAR` | Descrição Órgão Participante | sim | — | — |
| `meta_id` | `INTEGER` | ID Meta | sim | sem formatação | — |
| `gestores` | `VARCHAR` | Gestores do Projeto | sim | — | — |
| `fonte_recurso__valor_percentual` | `DOUBLE` | Valor Percentual da Fonte | sim | 2 casas | — |
| `fonte_recurso__valor_nominal` | `DOUBLE` | Valor Nominal da Fonte | sim | R$, 2 casas | — |
| `portfolios_compartilhados_titulos` | `VARCHAR` | Portfólios Compartilhados | sim | — | — |
| `secretario_responsavel` | `VARCHAR` | Secretário Responsável | sim | — | — |
| `secretario_executivo` | `VARCHAR` | Secretário Executivo | sim | — | — |
| `coordenador_ue` | `VARCHAR` | Coordenador UE | sim | — | — |
| `data_aprovacao` | `DATE` | Data de Aprovação | sim | — | — |
| `data_revisao` | `DATE` | Data de Revisão | sim | — | — |
| `versao` | `VARCHAR` | Versão | sim | — | — |
| `iniciativa_id` | `INTEGER` | ID Iniciativa | sim | sem formatação | — |
| `atividade_id` | `INTEGER` | ID Atividade | sim | sem formatação | — |
| `publico_alvo` | `VARCHAR` | Público-Alvo | sim | — | — |
| `status_traduzido` | `VARCHAR` | Status | sim | — | — |
| `premissa__id` | `INTEGER` | ID Premissa | sim | sem formatação | — |
| `premissa__premissa` | `VARCHAR` | Descrição da Premissa | sim | — | — |
| `restricao__id` | `INTEGER` | ID Restrição | sim | sem formatação | — |
| `restricao__restricao` | `VARCHAR` | Descrição da Restrição | sim | — | — |
| `fonte_recurso__id` | `INTEGER` | ID Fonte de Recurso | sim | sem formatação | — |
| `fonte_recurso__nome` | `VARCHAR` | Nome da Fonte de Recurso | sim | — | — |
| `fonte_recurso__fonte_recurso_cod_sof` | `VARCHAR` | Código SOF da Fonte | sim | — | — |
| `fonte_recurso__fonte_recurso_ano` | `INTEGER` | Ano da Fonte | sim | sem formatação | — |

[← todos os arquivos](../report-columns.md)
