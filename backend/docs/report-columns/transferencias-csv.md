# transferencias.csv

Uma linha por distribuição de recurso da transferência (ou por transferência, sem distribuição).

Fontes que produzem este arquivo: `Transferencias`

68 colunas.

Classe de linha: `RelTransferenciasCsvRow`

Colunas do CSV **bruto** de `transferencias.csv`.

A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
quando nenhum modelo é aplicado. Os nomes usam `__` no lugar de `.` para o aninhamento
(`distribuicao_recurso`, `orgao_concedente`) porque o builder DuckDB interpreta ponto
como referência qualificada por fonte.

Regra geral: valores aqui são "compute store" — números como números, datas em ISO
(`YYYY-MM-DD`), sem máscara de moeda e sem o hack `="valor"`. Moeda, separador decimal,
`dd/mm/aaaa` e o guard de texto do Excel são aplicados na etapa de pós-processamento.

Booleanos que o negócio exibe como `Sim`/`Não` continuam sendo traduzidos na extração:
é tradução de domínio (e não formatação de locale), então permanece `VARCHAR`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT` | ID | não | sem formatação | — |
| `identificador` | `VARCHAR` | Identificador | sim | — | — |
| `ano` | `INTEGER` | Ano | sim | sem formatação | — |
| `objeto` | `VARCHAR` | Objeto | sim | guard Excel | — |
| `detalhamento` | `VARCHAR` | Detalhamento | sim | guard Excel | — |
| `clausula_suspensiva` | `VARCHAR` | Clausula Suspensiva | sim | — | — |
| `clausula_suspensiva_vencimento` | `DATE` | Data de vencimento da Suspensiva | sim | — | — |
| `normativa` | `VARCHAR` | Normativa | sim | guard Excel | — |
| `observacoes` | `VARCHAR` | Observações | sim | guard Excel | — |
| `nome_programa` | `VARCHAR` | Nome Programa / Portfólio | sim | guard Excel | — |
| `empenho` | `VARCHAR` | Empenho | sim | — | — |
| `valor` | `DECIMAL(18,2)` | Valor do Repasse | sim | R$, 2 casas | — |
| `valor_total` | `DECIMAL(18,2)` | Valor Total | sim | R$, 2 casas | — |
| `valor_contrapartida` | `DECIMAL(18,2)` | Contrapartida | sim | R$, 2 casas | — |
| `emenda` | `VARCHAR` | Emenda | sim | guard Excel | — |
| `dotacao` | `VARCHAR` | Dotação Orçamentária | sim | guard Excel | — |
| `demanda` | `VARCHAR` | Número da Demanda/Proposta | sim | guard Excel | — |
| `banco_fim` | `VARCHAR` | Conta - Banco da Secretaria fim | sim | guard Excel | — |
| `conta_fim` | `VARCHAR` | Conta - Número da Secretaria fim | sim | guard Excel | — |
| `agencia_fim` | `VARCHAR` | Conta - Agência da Secretaria fim | sim | guard Excel | — |
| `banco_aceite` | `VARCHAR` | Conta - Banco do aceite | sim | guard Excel | — |
| `agencia_aceite` | `VARCHAR` | Conta - Agência do aceite | sim | guard Excel | — |
| `conta_aceite` | `VARCHAR` | Conta - Número do aceite | sim | guard Excel | — |
| `emenda_unitaria` | `VARCHAR` | Emenda Unitária | sim | guard Excel | — |
| `distribuicao_recurso__orgao_gestor_descricao` | `VARCHAR` | Gestor Municipal do Contrato (secretaria) | sim | guard Excel | — |
| `ordenador_despesa` | `VARCHAR` | Ordenador de despesas | sim | guard Excel | — |
| `secretaria_concedente` | `VARCHAR` | Secretaria do órgão concedente | sim | guard Excel | — |
| `plano_de_acao` | `VARCHAR` | Plano de Ação | sim | guard Excel | Código do detalhamento do uso dos repasses parlamentares nas transferências especiais. |
| `interface` | `VARCHAR` | Interface | sim | — | — |
| `esfera` | `VARCHAR` | Esfera | sim | — | — |
| `parlamentares_info` | `VARCHAR` | Parlamentares | sim | guard Excel | — |
| `orgao_concedente__descricao` | `VARCHAR` | Orgão Concedente | sim | — | — |
| `distribuicao_recurso__id` | `BIGINT` | ID Distribuição de Recurso | não | sem formatação | — |
| `distribuicao_recurso__nome_responsavel` | `VARCHAR` | Gestor Municipal (servidor) | sim | guard Excel | — |
| `distribuicao_recurso__objeto` | `VARCHAR` | Objeto detalhado | sim | guard Excel | — |
| `distribuicao_recurso__valor` | `DECIMAL(18,2)` | Distribuição - Valor do Repasse | sim | R$, 2 casas | — |
| `distribuicao_recurso__valor_total` | `DECIMAL(18,2)` | Distribuição - Valor Total | sim | R$, 2 casas | — |
| `distribuicao_recurso__valor_contrapartida` | `DECIMAL(18,2)` | Distribuição - Valor da Contrapartida | sim | R$, 2 casas | — |
| `distribuicao_recurso__empenho` | `VARCHAR` | Distribuição - Empenho | sim | — | — |
| `distribuicao_recurso__programa_orcamentario_estadual` | `VARCHAR` | Programa Orçamentário Estadual ou Federal | sim | guard Excel | — |
| `distribuicao_recurso__programa_orcamentario_municipal` | `VARCHAR` | Programa Orçamentário Municipal | sim | guard Excel | — |
| `distribuicao_recurso__dotacao` | `VARCHAR` | Dotação orçamentária | sim | guard Excel | — |
| `distribuicao_recurso__proposta` | `VARCHAR` | N° Proposta | sim | guard Excel | — |
| `distribuicao_recurso__contrato` | `VARCHAR` | Nº do Contrato | sim | guard Excel | — |
| `distribuicao_recurso__convenio` | `VARCHAR` | Nº do Convênio/Pré Convênio | sim | guard Excel | — |
| `distribuicao_recurso__assinatura_termo_aceite` | `DATE` | Data de assinatura do termo de aceite | sim | — | — |
| `distribuicao_recurso__assinatura_municipio` | `DATE` | Data de assinatura do representante do Município | sim | — | — |
| `distribuicao_recurso__assinatura_estado` | `DATE` | Data de assinatura do representante do Estado | sim | — | — |
| `distribuicao_recurso__vigencia` | `DATE` | Data de início da vigência | sim | — | — |
| `distribuicao_recurso__conclusao_suspensiva` | `DATE` | Data de conclusão da Suspensiva | sim | — | — |
| `distribuicao_recurso__registro_sei` | `VARCHAR` | Nº SEI | sim | — | — |
| `distribuicao_recurso__status_nome_base` | `VARCHAR` | Status da Demanda | sim | — | — |
| `distribuicao_recurso__pct_custeio` | `DOUBLE` | Custeio/Corrente (%) | sim | 2 casas, unidade `%` | — |
| `distribuicao_recurso__pct_investimento` | `DOUBLE` | Investimento/Capital (%) | sim | 2 casas, unidade `%` | — |
| `distribuicao_recurso__banco` | `VARCHAR` | Distribuição - Banco | sim | guard Excel | — |
| `distribuicao_recurso__agencia` | `VARCHAR` | Distribuição - Agência | sim | guard Excel | — |
| `distribuicao_recurso__conta` | `VARCHAR` | Distribuição - Conta Corrente | sim | guard Excel | — |
| `distribuicao_recurso__gestor_conta` | `VARCHAR` | Distribuição - Gestor da Conta | sim | guard Excel | — |
| `orgao_concedente__sigla` | `VARCHAR` | Orgão Concedente | sim | — | — |
| `orgao_concedente__id` | `BIGINT` | ID do Orgão Concedente | sim | sem formatação | — |
| `programa` | `VARCHAR` | Programa | sim | guard Excel | — |
| `pendente_preenchimento_valores` | `VARCHAR` | Pendente preenchimento de valores | sim | — | — |
| `gestor_contrato` | `VARCHAR` | Gestor do Contrato | sim | guard Excel | — |
| `numero_identificacao` | `VARCHAR` | Número de Identificação | sim | guard Excel | — |
| `tipo_transferencia` | `VARCHAR` | Tipo de Transferência | sim | guard Excel | — |
| `classificacao` | `VARCHAR` | Classificação | sim | guard Excel | — |
| `distribuicao_recurso__transferencia_id` | `BIGINT` | ID da Transferência (Distribuição) | sim | sem formatação | — |
| `distribuicao_recurso__orgao_gestor_id` | `BIGINT` | ID do Órgão Gestor (Distribuição) | sim | sem formatação | — |

[← todos os arquivos](../report-columns.md)
