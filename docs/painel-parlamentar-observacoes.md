# Painel do Parlamentar: avaliação das observações de homologação

Task S05.35. Este documento avalia as 12 observações, indica a alteração de cada uma e o objetivo dela. As correções de front foram implementadas na branch, ainda sem commit; a coluna Situação mostra o que falta.

**Base da avaliação:** código da branch `feature/S05.35_painel-parlamentares`, frames Painel e Biografia do Figma e telas abertas com Playwright no front local, ligado à API de homologação. Foram usados os parlamentares Alfredinho (id 2) e Alexandre Frota (id 69). Os dados de homologação incluem registros de teste, então os números servem para conferir o comportamento, não para validar valores reais.

Os caminhos de front são relativos a `frontend/src/views/parlamentares/ParlamentarDetalhe/`, e os de back, a `backend/src/casa-civil/`.

## Resumo

| #   | Observação                                | Avaliação                                                        | Responsável              | Situação                                                          |
| --- | ----------------------------------------- | ---------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------- |
| 1   | Moldura incompleta no Painel              | Procede, causa encontrada                                        | Front                    | Corrigido; "Dados do Parlamentar" também ganhou card (validar D1) |
| 2   | "Começo" e "Fim" nos campos               | Procede                                                          | Front                    | Corrigido                                                         |
| 3   | Campos de data só com anos                | Comportamento atual, recomendo manter                            | PO                       | Aguarda a decisão D2                                              |
| 4   | Texto de recursos                         | Procede                                                          | Front                    | Corrigido                                                         |
| 5   | Texto de secretaria                       | Procede                                                          | Front                    | Corrigido                                                         |
| 6   | Posição da mensagem de secretaria         | Procede                                                          | Front                    | Corrigido; confirmar o sentido de "(SMAE)"                        |
| 7   | Texto de partido                          | Procede                                                          | Front                    | Corrigido                                                         |
| 8   | Percentual de participação no município   | Fórmula igual ao Figma, mas diferente da task; exibição com erro | PO, back e front         | Exibição corrigida; cálculo aguarda a decisão D3                  |
| 9   | Tabela Emenda x Distribuição              | Bug no rodapé, reproduzido                                       | Front                    | Corrigido; valor da emenda no cabeçalho (validar D4)              |
| 10  | Alexandre Frota com 3 em andamento        | Corrigido em homologação (agora 1/3), mas há outro caso suspeito | Back e PO                | Aguarda análise do back e a decisão D5                            |
| 11  | Cores do gráfico de partido               | Procede                                                          | Design e front           | Paleta proposta aplicada (validar D6)                             |
| 12  | Fontes das Distribuições e falta de cards | Cards: mesma causa do item 1. Fontes: a esclarecer               | Front e @jeniferspinoza6 | Cards corrigidos; fonte em 11,9px (validar D7)                    |

## Observações

### 1. Moldura incompleta no Painel

**Diagnóstico:** o commit `ac0eb22b5` ("ajustando cards") removeu o fundo branco e a sombra de `components/PainelCartao.vue`. A medição na tela confirma a diferença entre as abas:

| Card                  | Fundo        | Sombra   |
| --------------------- | ------------ | -------- |
| Indicadores do Painel | transparente | nenhuma  |
| Cards da Biografia    | branco       | presente |

Nos dois frames do Figma, os cards têm fundo branco e sombra. O mesmo commit criou a prop `semFundo`, mas nenhum CSS a utiliza.

**Alteração (feita):** restaurado o fundo e a sombra no `PainelCartao` e removida a prop `semFundo`, seguindo o Figma também em "Dados do Parlamentar".

**Objetivo:** dar às duas abas a mesma aparência e voltar ao desenho aprovado.

**Ressalva:** entendemos "moldura" como o contorno visual dos cards; vale confirmar com quem registrou a observação. O commit não explica por que o estilo foi removido.

### 2. "Começo" e "Fim" nos campos de período

**Diagnóstico:** os textos são as opções vazias dos seletores em `components/FiltroDePeriodo.vue` e vieram do Figma. Os rótulos "Início do período" e "Fim do período" já explicam os campos.

**Alteração (feita):** a opção vazia ficou sem texto.

**Objetivo:** seguir o padrão de filtros do SMAE.

### 3. Campos de data mostram somente anos

**Diagnóstico:** o filtro trabalha com `ano_inicio` e `ano_fim`, aplicados sobre `transferencia.ano`. A transferência não tem uma data de referência para esse recorte: suas colunas de data são o vencimento da cláusula suspensiva e os registros de auditoria.

**Alteração recomendada:** manter o filtro por ano.

**Objetivo:** filtrar pelo ano da transferência, sem adotar uma data que não tenha significado para o negócio.

**Alternativa:** para filtrar por data, o PO precisa definir qual data vale, e o back precisa alterar o filtro.

**Ponto de atenção:** `transferencia.ano` aceita valor nulo. Transferências sem ano não aparecem quando há filtro de período.

### 4. Texto do card de recursos

**Alteração (feita):** texto trocado para "Total de recursos disponibilizados e percentual utilizado" em `partials/ParlamentarDetalhePainel.vue`.

**Objetivo:** corrigir o texto herdado do Figma, que tinha vírgulas indevidas e o trecho "em reais".

### 5. Texto do card de secretaria

**Alteração (feita):** texto trocado para "Total de recursos disponibilizados pelo parlamentar para cada secretaria" no mesmo arquivo.

**Objetivo:** remover a vírgula indevida herdada do Figma.

### 6. Posição da mensagem de secretaria

**Diagnóstico:** o conteúdo do `PainelCartao` cresce para ocupar o espaço livre (`flex-grow: 1`). Junto com a altura mínima do card e o esticamento da grade, isso prende a mensagem no fim do card, seja qual for o número de secretarias. Na tela, o vão entre a lista e a mensagem é de 289px com 2 secretarias (Alexandre Frota) e de 222px com 3 (Alfredinho).

**Alteração (feita):** nesse card, a mensagem vem logo depois da última barra (vão de 0px na tela, com 2 e com 3 secretarias). O card mantém a altura da coluna vizinha, então o espaço livre fica abaixo da mensagem.

**Objetivo:** evitar um vazio entre a lista e a mensagem quando há poucas secretarias.

**Limite:** o back retorna no máximo 5 secretarias mais a linha "Outros" (`PAINEL_TOP_N`), como no Figma. Falta confirmar o que "(SMAE)" significa na observação. Se a intenção for listar todas as secretarias, o back também precisa mudar.

### 7. Texto do card de partido

**Alteração (feita):** texto trocado para "Total de recursos disponibilizados pelo parlamentar por partido" no mesmo arquivo.

**Objetivo:** corrigir o texto do Figma ("referente á seu partido"), que não descrevia bem o gráfico.

### 8. O percentual de participação no município está correto?

**Diagnóstico:** o cálculo em `painel-parlamentar/painel-parlamentar.service.ts` é:

```text
soma de transferencia_parlamentar.valor do parlamentar, em transferências em andamento
÷ soma de transferencia_parlamentar.valor de todos os parlamentares, em transferências em andamento
```

Isso corresponde ao texto do Figma. A task, porém, pede a participação "em relação ao total de recursos recebidos por emendas", sem limitar a transferências em andamento. Portanto, a fórmula segue o desenho, mas pode não responder à pergunta de negócio. O resultado também muda com a regra de "em andamento" (item 10), e valores nulos não entram na soma.

O efeito dessa base aparece nos dados de homologação:

| Parlamentar     | Disponibilizado (todas) | Considerado (em andamento) | Total em andamento | Calculado | Na tela |
| --------------- | ----------------------- | -------------------------- | ------------------ | --------- | ------- |
| Alfredinho      | R$ 1.800.000,00         | R$ 1.000.000,00            | R$ 129.245.982,03  | 0,77%     | 1%      |
| Alexandre Frota | R$ 170.000,00           | R$ 0,00                    | R$ 129.245.982,03  | 0%        | 0%      |

Alexandre Frota aparece com 0% apesar de ter R$ 170.000,00 disponibilizados, porque a única transferência em andamento dele tem valor zero.

Há também dois problemas de exibição em `components/BarraDePercentual.vue`:

- **Arredondamento:** o percentual aparece sem casas decimais, e 0,77% vira 1%.
- **Barra de 0%:** o preenchimento tem `min-width: 2.4rem`, então a barra pinta um trecho azul mesmo em 0%. A mesma regra afeta outros valores baixos.

**Alteração:**

1. O PO define a base do cálculo (D3).
2. O back ajusta a consulta, se a base mudar.
3. **Feito:** o front exibe até 2 casas decimais (0,77%; 88,82%) e não pinta a barra em 0%. Valores baixos, acima de zero, mantêm o preenchimento mínimo para continuarem visíveis.
4. Validar um caso real comparando `valor_parlamentar` e `valor_total`, que a API já retorna.

**Objetivo:** garantir que o número responda à pergunta de negócio e possa ser conferido.

### 9. Tabela Emenda x Distribuição

**Diagnóstico:** em `components/CartaoDeTransferencia.vue`, as linhas da coluna "Valor do parlamentar" mostram o valor em cada distribuição. O rodapé da mesma coluna mostra `valor_parlamentar`, que é o valor da emenda. Assim, o total pode não corresponder às linhas.

O erro foi reproduzido na transferência 3/2025 do Alexandre Frota:

| Distribuição                                        | Valor do parlamentar |
| --------------------------------------------------- | -------------------- |
| obj xxxxxx 2025 (SEME)                              | R$ 0,00              |
| proj 2 (Bombeiros)                                  | R$ 1.000,00          |
| proj 3 (EMAE, não contabilizada)                    | R$ 0,00              |
| **Rodapé atual**                                    | **R$ 20.000,00**     |
| **Valor correto** (`valor_parlamentar_distribuido`) | **R$ 1.000,00**      |

O commit `c9bc761c6` adicionou esse campo à API, e ele já é retornado em homologação, mas o front ainda não o utiliza. A figura anexada às 18:12 não foi consultada.

**Alteração (feita):** o rodapé usa `valor_parlamentar_distribuido` (R$ 1.000,00 na transferência 3/2025), e o valor da emenda passou para o cabeçalho do card, conforme a recomendação de D4. A massa de `components/CartaoDeTransferencia.spec.ts` agora diferencia os dois campos.

**Objetivo:** fazer o total corresponder à coluna.

**Pontos de atenção:**

- O cabeçalho com "Valor da emenda" não está no Figma e precisa de validação (D4).
- Linhas não contabilizadas continuam visíveis, em opacidade reduzida, mas ficam fora do total. Isso é intencional e pode precisar de explicação na tela.
- O Figma não serve de referência para o total, pois usa valores fictícios.

### 10. Alexandre Frota: as 3 transferências estão em andamento?

**Diagnóstico:** o caso relatado já não ocorre. O commit `c9bc761c6` deixou de contar transferências sem workflow, e o Alexandre Frota agora aparece com 1/3 em homologação. Pelos dados retornados, a transferência contada é a 42/2025 (etapa Seleção, fase Registro), a única das 3 com etapa e fase.

A regra atual é:

```sql
t.workflow_id IS NOT NULL AND NOT t.workflow_finalizado
```

Ainda há dois pontos abertos:

- **Transferência com fase cancelada contada como em andamento:** o Alfredinho aparece com 1/3 e R$ 1.000.000,00 em andamento. O único valor compatível é o da transferência 11/2024, que está na etapa Histórico, fase Encerrada e situação Cancelada. Essa ligação é uma dedução a partir dos valores; falta o back confirmar e verificar por que `workflow_finalizado` continua falso nesse caso.
- **Início automático:** o workflow inicia sozinho quando existe um workflow ativo para o tipo da transferência (`transferencia/transferencia.service.ts`, linhas 197 e 496). Assim, "em andamento" significa "tem workflow e ainda não terminou", mesmo sem nenhuma movimentação.

**Alteração:**

1. O back analisa a transferência 11/2024 e corrige a regra, se for o caso.
2. O PO valida o que conta como "em andamento" (D5).
3. O back confere a consistência com `dash/transferencia.service.ts`, linha 409. O arquivo conta `workflow_finalizado == false` e não filtra por `workflow_id`, então os dois painéis podem divergir.

**Objetivo:** dar a "em andamento" um significado único e verificável.

**Sugestões opcionais:**

- Exibir etapa e fase no card da transferência, pois a API já as retorna. Hoje a tela não mostra por que uma transferência conta como em andamento.
- Definir o título da lista: o Figma usa "Transferências em andamento", enquanto o código usa "Transferências" e lista todas, como pede a task.

### 11. Cores do gráfico de partido

**Diagnóstico:** `components/coresDoPainel.ts` usa cinco tons de azul-marinho vindos do Figma, difíceis de distinguir em um gráfico por categoria. Na tela, as duas fatias do Alexandre Frota (PROS e PDT) ficam quase iguais. O arquivo também atende às barras de secretaria.

**Alteração (feita, como proposta):** o gráfico de partido usa uma paleta categórica própria (`#2A78D6`, `#EB6834`, `#1BAF7A`, `#EDA100`, `#E87BA4`), aprovada no validador de cores, inclusive para daltonismo. Os valores da legenda passaram a usar texto escuro, com um marcador colorido ao lado, porque três dessas cores têm contraste baixo para texto. As barras de secretaria mantêm a paleta atual.

**Objetivo:** permitir identificar cada partido no gráfico.

**Pontos de atenção da paleta:**

- A cor segue a posição no ranking, então o mesmo partido pode mudar de cor ao trocar o período.
- A paleta não foi escolhida por partido, mas algumas cores podem lembrar partidos específicos. Design deve avaliar (D6).

### 12. Fontes das Distribuições e falta de cards

**Cards (corrigido):** é a mesma causa e a mesma correção do item 1. O card de cada transferência já tem fundo e sombra; o problema está nos cards de indicadores.

**Fontes, diagnóstico:** o cabeçalho da tabela mede 9,8px na tela, próximo dos 10px do Figma. O código segue o desenho, então o problema pode estar no próprio desenho. Na tela, a largura das colunas também muda de um card para outro, e o cabeçalho quebra linha em alguns deles, o que pode fazer parte da queixa.

**Fontes, alteração (feita, como proposta):** o cabeçalho da tabela passou para 11,9px. @jeniferspinoza6 confirma se era esse o incômodo (D7). A diferença de largura das colunas entre os cards não foi alterada.

**Objetivo:** melhorar a leitura da tabela.

## Decisões pendentes

| #   | Decisão                                                                                                  | Quem decide       | Recomendação                                                                            |
| --- | -------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------- |
| D1  | "Dados do Parlamentar" deve ter card? O Figma mostra card; antes o código pedia `sem-fundo`, sem efeito. | Design            | Aplicada: seguir o Figma; `semFundo` removida                                           |
| D2  | O filtro do painel continua por ano?                                                                     | PO                | Sim                                                                                     |
| D3  | A participação considera só transferências em andamento ou todas?                                        | PO                | Definir pelo uso esperado do indicador. Sem isso, não é possível validar o número       |
| D4  | O valor da emenda deve continuar visível no card?                                                        | PO e @lucasansei1 | Aplicada: sim, no cabeçalho, ao lado dos outros valores                                 |
| D5  | Ter workflow não finalizado basta para estar "em andamento"?                                             | PO                | Não contar transferências em fase encerrada ou cancelada; validar com o caso da 11/2024 |
| D6  | Qual paleta usar no gráfico de partido?                                                                  | @josiannemomberg  | Aplicada como proposta: paleta categórica própria, só para partido                      |
| D7  | O que deve mudar nas fontes das Distribuições?                                                           | @jeniferspinoza6  | Aplicada como proposta: cabeçalho da tabela com cerca de 12px                           |

## Próximos passos

1. **Validar as propostas aplicadas:** D1, D4, D6 e D7.
2. **Regras de negócio:** itens 10 e 8, nessa ordem, porque o percentual depende da definição de "em andamento".
3. **Responder à observação do item 3,** depois da decisão D2.

## Regra de acesso do Gestor de Distribuição

Não faz parte das observações, mas foi conferida. O perfil Gestor de Distribuição de Recurso tem `CadastroParlamentar.listar` e não tem `CadastroParlamentar.painel`, então a regra da task está atendida no perfil padrão. O recorte por órgão (`orgaoRestrito`) no back só tem efeito para quem acumula outro perfil com acesso ao painel.

## O que falta verificar

- **Transferência 11/2024:** a relação com o "em andamento" do Alfredinho foi deduzida dos valores. O back precisa confirmar pelo banco.
- **Valores reais:** só dois parlamentares foram conferidos, em dados de homologação. O percentual do item 8 ainda precisa de validação com um caso real.
- **Figura das 18:12:** não foi consultada, e ela pode mostrar algo além do item 9.
- **Figma:** foi lido como dados estruturados, sem screenshot. A comparação visual com o desenho fica parcial.
