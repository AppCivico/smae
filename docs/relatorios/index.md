# Relatórios do SMAE

Todos os relatórios são gerados via `POST /relatorios` com o campo `fonte` indicando o tipo.
Os arquivos produzidos são empacotados em `.zip` quando há mais de um.

---

## PDM — Monitoramento Mensal (`MonitoramentoMensal`)

**Serviço:** `monitoramento-mensal.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `painel-{nome}.{id}.{periodicidade}.csv` | meta_*, iniciativa_*, atividade_*, variavel_*, data, Previsto, PrevistoAcumulado, Realizado, RealizadoAcumulado |
| `analises-qualitativas.csv` _(opcional)_ | id, criador, criado_em, informacoes_complementares, referencia_data, meta_* |
| `fechamentos.csv` _(opcional)_ | id, criador, criado_em, comentario, referencia_data, meta_* |
| `analises-de-risco.csv` _(opcional)_ | id, criador, criado_em, ponto_de_atencao, detalhamento, referencia_data, meta_* |
| `serie-variaveis.csv` _(opcional)_ | serie, variavel_*, codigo, data_valor, valor_nominal, conferida, aguarda_cp, meta_*, iniciativa_*, atividade_*, analise_qualitativa |

---

## PS — Monitoramento Mensal (`PSMonitoramentoMensal`)

**Serviço:** `ps-monitoramento-mensal.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `monitoramento-mensal-variaveis-ps.csv` _(opcional)_ | indicador_*, variavel_*, municipio, regiao, subprefeitura, distrito, serie, data_referencia, valor_nominal, eh_previa, analises |
| `analises-qualitativas-ps.csv` _(opcional)_ | id, criador, criado_em, informacoes_complementares, referencia_data, meta_* |
| `analises-de-risco-ps.csv` _(opcional)_ | id, criador, criado_em, ponto_de_atencao, detalhamento, referencia_data, meta_* |
| `fechamentos-ps.csv` _(opcional)_ | id, criador, criado_em, comentario, referencia_data, meta_* |
| + arquivos de indicadores | (ver Indicadores abaixo) |

---

## PDM/PS — Indicadores (`Indicadores` / `PSIndicadores`)

**Serviço:** `indicadores.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `indicadores.csv` _(opcional)_ | meta_*, iniciativa_*, atividade_*, indicador_*, Data de Referência, Serie, Valor, É Prévia |
| `regioes.csv` _(opcional)_ | variavel_*, regiao_nivel_2/3/4_*, Data de Referência, Serie, Valor, Valor Categórica |

---

## PDM/PP/PS — Orçamento Executado e Planejado

### `Orcamento` / `PSOrcamento`
**Serviço:** `orcamento.service.ts` — filtra por metas PDM/PS

### `ProjetoOrcamento` / `ObrasOrcamento`
**Serviço:** `orcamento.service.ts` — filtra por projetos PP/MDO

| Arquivo | Colunas principais |
|---|---|
| `executado.csv` _(opcional)_ | meta_* ou projeto_*, dotacao, processo, nota_empenho, orgao_*, unidade_*, fonte_*, acao_orcamentaria, smae_valor_empenhado, smae_valor_liquidado, logs |
| `planejado.csv` _(opcional)_ | meta_* ou projeto_*, dotacao, orgao_*, unidade_*, fonte_*, acao_orcamentaria, plan_sof_val_orcado_atualizado, plan_valor_planejado, logs |

---

## PDM/PP/PS — Previsão de Custo

### `PrevisaoCusto` / `PSPrevisaoCusto`
**Serviço:** `previsao-custo.service.ts` — filtra por metas PDM/PS

### `ProjetoPrevisaoCusto` / `ObrasPrevisaoCusto`
**Serviço:** `previsao-custo.service.ts` — filtra por projetos PP/MDO

| Arquivo | Colunas principais |
|---|---|
| `previsao-custo.csv` | meta_* ou projeto_*, iniciativa_*, atividade_*, ano_referencia, custo_previsto, parte_dotacao, criado_em, atualizado_em |

---

## PP — Projeto (individual) (`Projeto`)

**Serviço:** `pp-projeto.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `detalhes-do-projeto.csv` | id, codigo, nome, status, previsao_*, realizado_*, orgao_*, responsavel, premissas, restricoes, etiquetas (~60 campos) |
| `cronograma.csv` | hierarquia, tarefa, inicio/termino planejado/real, custo_estimado, custo_real, percentual_concluido |
| `acompanhamentos.csv` | id, tipo, data_registro, participantes, detalhamento, pontos_atencao, pauta, riscos |
| `encaminhamentos.csv` | acompanhamento_id, encaminhamento, responsavel, prazo, prazo_realizado |
| `riscos.csv` | codigo, titulo, probabilidade, impacto, grau, status |
| `planos-acao.csv` _(opcional)_ | codigo_risco, contramedida, prazo, responsavel, medidas_de_contingencia |
| `arquivos.csv` _(opcional)_ | nome_original, criado_em, criador_id, criador_nome_exibicao, caminho, descricao, arquivo_id |
| `contratos.csv` | numero, status, objeto, empresa_contratada, valor, valor_reajustado, datas, modalidade |
| `aditivos.csv` | tipo, data, valor_com_reajuste, percentual_medido, data_termino_atual |
| `origens.csv` | pdm_*, meta_*, iniciativa_*, atividade_* |
| `enderecos.csv` | endereco, cep, zona, distrito, subprefeitura |
| `eap.svg` _(opcional)_ | Diagrama EAP |
| `info.json` | Metadados do relatório |

---

## PP — Projetos (lista) (`Projetos`)

**Serviço:** `pp-projetos.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `projetos.csv` | id, codigo, nome, status, portfolio_*, orgao_*, responsavel, previsao_*, fontes_recurso, etiquetas (~50 campos) |
| `cronograma.csv` | projeto_id, projeto_codigo, hierarquia, tarefa, inicio/termino planejado/real, custo_*, percentual_concluido, atraso |
| `riscos.csv` | projeto_id, projeto_codigo, codigo, titulo, probabilidade, impacto, grau, resposta, tarefas_afetadas |
| `planos_de_acao.csv` | projeto_id, risco_codigo, contramedida, prazo, responsavel, medidas_de_contingencia, custo |
| `monitoramento_planos_de_acao.csv` | projeto_id, risco_codigo, plano_acao_id, data_afericao, descricao |
| `licoes_aprendidas.csv` | projeto_id, sequencial, data_registro, responsavel, descricao, contexto, resultado |
| `acompanhamentos.csv` | projeto_id, data_registro, participantes, detalhamento, pontos_atencao, encaminhamento |
| `contratos.csv` | projeto_id, numero, status, valor, empresa_contratada, datas, modalidade |
| `aditivos.csv` | contrato_id, tipo, data, valor_com_reajuste, percentual_medido, data_termino_atual |
| `origens.csv` | projeto_id, pdm_*, meta_*, iniciativa_*, atividade_* |
| `arquivos.csv` _(opcional)_ | projeto_id, projeto_codigo, nome_original, criado_em, criador_id, criador_nome_exibicao, caminho, descricao, arquivo_id |
| `geoloc.csv` | projeto_id, endereco, cep, zona, distrito, subprefeitura |

---

## PP — Status de Projetos (`ProjetoStatus`)

**Serviço:** `pp-status.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `projeto-status.csv` | id, codigo, nome, previsao_custo, realizado_custo, cronograma, orgao_responsavel_sigla, detalhamento, pontos_atencao, tarefas |

---

## MDO — Obras (lista) (`Obras`)

**Serviço:** `pp-obras.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `obras.csv` | id, codigo, nome, status, portfolio_*, pdm_*, grupo_tematico, tipo_intervencao, orgao_*, responsavel, previsao_*, etiquetas (~60 campos) |
| `cronograma.csv` | projeto_id, obra_codigo, hierarquia, tarefa, inicio/termino planejado/real, custo_*, percentual_concluido, atraso |
| `regioes.csv` | projeto_id, descricao, sigla, nivel |
| `acompanhamentos.csv` | projeto_id, data_registro, participantes, detalhamento, pontos_atencao, encaminhamento |
| `fontes_recurso.csv` | projeto_id, valor_percentual, valor_nominal, fonte_recurso_cod_sof, fonte_recurso_ano |
| `contratos.csv` | obra_id, numero, status, valor, empresa_contratada, datas, modalidade, orgao_* |
| `aditivos.csv` | contrato_id, tipo, data, valor_com_reajuste, percentual_medido, data_termino_atual |
| `origens.csv` | projeto_id, pdm_*, meta_*, iniciativa_*, atividade_* |
| `processos_sei.csv` | obra_id, categoria, processo_sei, descricao, link, comentarios |
| `enderecos.csv` | projeto_id, endereco, geojson, zona, distrito, subprefeitura |
| `arquivos.csv` _(opcional)_ | obra_id, obra_codigo, nome_original, criado_em, criador_id, criador_nome_exibicao, caminho, descricao, arquivo_id |

---

## MDO — Status de Obras (`ObraStatus`)

**Serviço:** `pp-status.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `obra-status.csv` | id, codigo, nome, previsao_custo, realizado_custo, cronograma, orgao_responsavel_sigla, detalhamento, pontos_atencao, tarefas |

---

## Transferências (`Transferencias`)

**Serviço:** `transferencias.service.ts`

Suporta dois modos: **Geral** (completo) e **Simplificado**.

| Arquivo | Colunas principais |
|---|---|
| `transferencias.csv` (Geral) | id, identificador, ano, objeto, valor, orgao_concedente, parlamentares, distribuicao_recurso_* (~50 campos) |
| `transferencias.csv` (Simplificado) | identificador, ano, objeto, parlamentares, valor, orgao_concedente, status |
| `cronograma.csv` _(opcional)_ | transferencia_id, hierarquia, tarefa, inicio_planejado, termino_planejado, custo_estimado |

---

## Tribunal de Contas (`TribunalDeContas`)

**Serviço:** `tribunal-de-contas.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `tribunal-de-contas.csv` | emenda, programa, ano, parlamentar, valor_repasse, acao, gestor_municipal, prazo_vigencia, dotacao, rubrica, finalidade, valor_empenho, liquidacao |

---

## Casa Civil — Atividades Pendentes (`AtvPendentes`)

**Serviço:** `casa-civil-atividades-pendentes.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `atividades-pendentes.csv` | identificador, parlamentares, valor, atividade, inicio_planejado, termino_planejado, inicio_real, orgao_responsavel, responsavel_atividade |

---

## Casa Civil — Demandas (`Demandas`)

**Serviço:** `demandas.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `demandas.csv` | id, status, data_registro, orgao_gestor, responsavel, nome_projeto, descricao, justificativa, valor, area_tematica |
| `enderecos.csv` _(opcional)_ | demanda_id, nome_projeto, cep, endereco, bairro, subprefeitura, distrito |

---

## Parlamentares (`Parlamentares`)

**Serviço:** `parlamentares.service.ts`

| Arquivo | Colunas principais |
|---|---|
| `parlamentares.csv` | id, nome_civil, nome_parlamentar, partido_sigla, cargo, uf, titular_suplente, endereco, gabinete, telefone, email, zona_atuacao |
