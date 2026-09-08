# transferencias.csv

Uma linha por transferência, sem as colunas de distribuição de recurso — o mesmo conteúdo de transferencias_e_distribuicao.csv sem as linhas repetidas por distribuição.

Fontes que produzem este arquivo: `Transferencias`

40 colunas.

Classe de linha: `RelTransferenciasCsvRow`

Colunas do CSV bruto de `transferencias.csv`: as mesmas de
`transferencias_e_distribuicao.csv`, menos tudo que vem da distribuição de recurso.

É **uma linha por transferência**, e é o arquivo que responde à pergunta mais comum do
relatório ("quais transferências, com que valores"). O arquivo com as duas entidades continua
existindo ao lado, para quem precisa do detalhamento por distribuição.

A separação existe porque uma transferência com N distribuições ocupa N linhas no arquivo
completo, e o que diferencia essas linhas são justamente as colunas `distribuicao_recurso__*`.
Quem montava um modelo só com colunas de transferência lia aquilo como se o relatório
estivesse duplicando registros.

Deduplicar o arquivo completo com `DISTINCT` não era opção: destruiria o detalhamento por
distribuição, que é o motivo de ele existir. A resposta é entregar as duas granularidades
lado a lado e deixar a escolha para quem abre o zip.

As colunas são copiadas de `RelTransferenciasEDistribuicaoCsvRow` (mesma ordem, rótulo, tipo
e formatação) em vez de redeclaradas: são o mesmo dado, e duas listas manuais divergiriam.

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
| `ordenador_despesa` | `VARCHAR` | Ordenador de despesas | — | — |
| `secretaria_concedente` | `VARCHAR` | Secretaria do órgão concedente | — | — |
| `plano_de_acao` | `VARCHAR` | Plano de Ação | — | Código do detalhamento do uso dos repasses parlamentares nas transferências especiais. |
| `interface` | `VARCHAR` | Interface | — | — |
| `esfera` | `VARCHAR` | Esfera | — | — |
| `status` | `VARCHAR` | Status | — | Situação da transferência: "Cancelada" quando cancelada, senão "Ativa". |
| `parlamentares_info` | `VARCHAR` | Parlamentares | — | — |
| `orgao_concedente__descricao` | `VARCHAR` | Orgão Concedente | — | — |
| `orgao_concedente__sigla` | `VARCHAR` | Sigla do Orgão Concedente | — | — |
| `orgao_concedente__id` | `BIGINT` | ID do Orgão Concedente | sem formatação | — |
| `programa` | `VARCHAR` | Programa | — | — |
| `pendente_preenchimento_valores` | `VARCHAR` | Pendente preenchimento de valores | — | — |
| `gestor_contrato` | `VARCHAR` | Gestor do Contrato | — | — |
| `numero_identificacao` | `VARCHAR` | Número de Identificação | — | — |
| `tipo_transferencia` | `VARCHAR` | Tipo de Transferência | — | — |
| `classificacao` | `VARCHAR` | Classificação | — | — |

[← todos os arquivos](../report-columns.md)
