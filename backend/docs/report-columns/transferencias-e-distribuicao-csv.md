# transferencias_e_distribuicao.csv

Uma linha por distribuição de recurso da transferência (ou por transferência, quando não há distribuição).

Fontes que produzem este arquivo: `Transferencias`

69 colunas.

Classe de linha: `RelTransferenciasEDistribuicaoCsvRow`

Colunas do CSV **bruto** de `transferencias_e_distribuicao.csv` — o conjunto completo.

Granularidade: **uma linha por distribuição de recurso**. Uma transferência com N
distribuições ocupa N linhas, e o que diferencia essas linhas são só as colunas
`distribuicao_recurso__*`. Quem não quer esse detalhamento tem `transferencias.csv`, com uma
linha por transferência — ver `RelTransferenciasCsvRow`, logo abaixo.

O arquivo já se chamou `transferencias.csv`, o que fazia quem selecionava só colunas de
transferência ler as N linhas repetidas como duplicação do relatório. O nome composto é o
aviso: aqui é o produto das duas entidades.

A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
quando nenhum modelo é aplicado. Os nomes usam `__` no lugar de `.` para o aninhamento
(`distribuicao_recurso`, `orgao_concedente`) porque o builder DuckDB interpreta ponto
como referência qualificada por fonte.

Regra geral: valores aqui são "compute store" — números como números, datas em ISO
(`YYYY-MM-DD`), sem máscara de moeda e sem o hack `="valor"`. Moeda, separador decimal,
`dd/mm/aaaa` são aplicados na etapa de pós-processamento.

Booleanos que o negócio exibe como `Sim`/`Não` continuam sendo traduzidos na extração:
é tradução de domínio (e não formatação de locale), então permanece `VARCHAR`.

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `id` | `BIGINT` | ID | sem formatação | — |
| `identificador` | `VARCHAR` | Identificador | — | — |
| `ano` | `INTEGER` | Ano | sem formatação | — |
| `objeto` | `VARCHAR` | Objeto | — | — |
| `detalhamento` | `VARCHAR` | Detalhamento | — | — |
| `clausula_suspensiva` | `VARCHAR` | Clausula Suspensiva | — | — |
| `clausula_suspensiva_vencimento` | `DATE` | Data de vencimento da Suspensiva | — | — |
| `normativa` | `VARCHAR` | Normativa | — | — |
| `observacoes` | `VARCHAR` | Observações | — | — |
| `nome_programa` | `VARCHAR` | Nome Programa / Portfólio | — | — |
| `empenho` | `VARCHAR` | Empenho | — | — |
| `valor` | `DECIMAL(18,2)` | Valor do Repasse | R$, 2 casas | — |
| `valor_total` | `DECIMAL(18,2)` | Valor Total | R$, 2 casas | — |
| `valor_contrapartida` | `DECIMAL(18,2)` | Contrapartida | R$, 2 casas | — |
| `emenda` | `VARCHAR` | Emenda | — | — |
| `dotacao` | `VARCHAR` | Dotação Orçamentária | — | — |
| `demanda` | `VARCHAR` | Número da Demanda/Proposta | — | — |
| `banco_fim` | `VARCHAR` | Conta - Banco da Secretaria fim | — | — |
| `conta_fim` | `VARCHAR` | Conta - Número da Secretaria fim | — | — |
| `agencia_fim` | `VARCHAR` | Conta - Agência da Secretaria fim | — | — |
| `banco_aceite` | `VARCHAR` | Conta - Banco do aceite | — | — |
| `agencia_aceite` | `VARCHAR` | Conta - Agência do aceite | — | — |
| `conta_aceite` | `VARCHAR` | Conta - Número do aceite | — | — |
| `emenda_unitaria` | `VARCHAR` | Emenda Unitária | — | — |
| `distribuicao_recurso__orgao_gestor_descricao` | `VARCHAR` | Gestor Municipal do Contrato (secretaria) | — | — |
| `ordenador_despesa` | `VARCHAR` | Ordenador de despesas | — | — |
| `secretaria_concedente` | `VARCHAR` | Secretaria do órgão concedente | — | — |
| `plano_de_acao` | `VARCHAR` | Plano de Ação | — | Código do detalhamento do uso dos repasses parlamentares nas transferências especiais. |
| `interface` | `VARCHAR` | Interface | — | — |
| `esfera` | `VARCHAR` | Esfera | — | — |
| `status` | `VARCHAR` | Status | — | Situação da transferência: "Cancelada" quando cancelada, senão "Ativa". |
| `parlamentares_info` | `VARCHAR` | Parlamentares | — | — |
| `orgao_concedente__descricao` | `VARCHAR` | Orgão Concedente | — | — |
| `distribuicao_recurso__id` | `BIGINT` | ID Distribuição de Recurso | sem formatação | — |
| `distribuicao_recurso__nome_responsavel` | `VARCHAR` | Gestor Municipal (servidor) | — | — |
| `distribuicao_recurso__objeto` | `VARCHAR` | Objeto detalhado | — | — |
| `distribuicao_recurso__valor` | `DECIMAL(18,2)` | Distribuição - Valor do Repasse | R$, 2 casas | — |
| `distribuicao_recurso__valor_total` | `DECIMAL(18,2)` | Distribuição - Valor Total | R$, 2 casas | — |
| `distribuicao_recurso__valor_contrapartida` | `DECIMAL(18,2)` | Distribuição - Valor da Contrapartida | R$, 2 casas | — |
| `distribuicao_recurso__empenho` | `VARCHAR` | Distribuição - Empenho | — | — |
| `distribuicao_recurso__programa_orcamentario_estadual` | `VARCHAR` | Programa Orçamentário Estadual ou Federal | — | — |
| `distribuicao_recurso__programa_orcamentario_municipal` | `VARCHAR` | Programa Orçamentário Municipal | — | — |
| `distribuicao_recurso__dotacao` | `VARCHAR` | Distribuição - Dotação Orçamentária | — | — |
| `distribuicao_recurso__proposta` | `VARCHAR` | N° Proposta | — | — |
| `distribuicao_recurso__contrato` | `VARCHAR` | Número do Instrumento | — | — |
| `distribuicao_recurso__convenio` | `VARCHAR` | Nº do Convênio/Pré Convênio | — | — |
| `distribuicao_recurso__assinatura_termo_aceite` | `DATE` | Data de assinatura do termo de aceite | — | — |
| `distribuicao_recurso__assinatura_municipio` | `DATE` | Data de assinatura do representante do Município | — | — |
| `distribuicao_recurso__assinatura_estado` | `DATE` | Data de assinatura do representante do Estado | — | — |
| `distribuicao_recurso__vigencia` | `DATE` | Data de início da vigência | — | — |
| `distribuicao_recurso__conclusao_suspensiva` | `DATE` | Data de conclusão da Suspensiva | — | — |
| `distribuicao_recurso__registro_sei` | `VARCHAR` | Nº SEI | — | — |
| `distribuicao_recurso__status_nome_base` | `VARCHAR` | Status da Demanda | — | — |
| `distribuicao_recurso__pct_custeio` | `DOUBLE` | Custeio/Corrente (%) | 2 casas, unidade `%` | — |
| `distribuicao_recurso__pct_investimento` | `DOUBLE` | Investimento/Capital (%) | 2 casas, unidade `%` | — |
| `distribuicao_recurso__banco` | `VARCHAR` | Distribuição - Banco | — | — |
| `distribuicao_recurso__agencia` | `VARCHAR` | Distribuição - Agência | — | — |
| `distribuicao_recurso__conta` | `VARCHAR` | Distribuição - Conta Corrente | — | — |
| `distribuicao_recurso__gestor_conta` | `VARCHAR` | Distribuição - Gestor da Conta | — | — |
| `orgao_concedente__sigla` | `VARCHAR` | Sigla do Orgão Concedente | — | — |
| `orgao_concedente__id` | `BIGINT` | ID do Orgão Concedente | sem formatação | — |
| `programa` | `VARCHAR` | Programa | — | — |
| `pendente_preenchimento_valores` | `VARCHAR` | Pendente preenchimento de valores | — | — |
| `gestor_contrato` | `VARCHAR` | Gestor do Contrato | — | — |
| `numero_identificacao` | `VARCHAR` | Número de Identificação | — | — |
| `tipo_transferencia` | `VARCHAR` | Tipo de Transferência | — | — |
| `classificacao` | `VARCHAR` | Classificação | — | — |
| `distribuicao_recurso__transferencia_id` | `BIGINT` | ID da Transferência (Distribuição) | sem formatação | — |
| `distribuicao_recurso__orgao_gestor_id` | `BIGINT` | ID do Órgão Gestor (Distribuição) | sem formatação | — |

[← todos os arquivos](../report-columns.md)
