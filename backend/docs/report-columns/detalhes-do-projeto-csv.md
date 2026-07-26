# detalhes-do-projeto.csv

Linha única com o cabeçalho/detalhes do projeto.

Fontes que produzem este arquivo: `Projeto`

62 colunas.

Classe de linha: `RelProjetoDetalheCsvRow`

Colunas do CSV bruto de `detalhes-do-projeto.csv` (sempre uma única linha).

A ordem reproduz a ordem de inserção das chaves no objeto `detail` montado em `asJSON()`
— que era exatamente o que definia o cabeçalho antes, já que não havia `fields`.

Dois campos do `detail` são objetos e, portanto, achatados: `projeto_etapa` (`IdDesc`) e
`meta` (`ProjetoMetaDetailDto`).

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `BIGINT` | ID do Projeto | não | sem formatação | — |
| `codigo` | `VARCHAR` | Código | sim | guard Excel | — |
| `portfolio_id` | `BIGINT` | ID do Portfólio | não | sem formatação | — |
| `nome` | `VARCHAR` | Nome | sim | — | — |
| `portfolio_titulo` | `VARCHAR` | Portfólio | sim | — | — |
| `etiquetas` | `VARCHAR` | Etiquetas | sim | — | — |
| `status` | `VARCHAR` | Status | sim | — | — |
| `projeto_etapa__id` | `BIGINT` | Etapa - ID | sim | sem formatação | — |
| `projeto_etapa__descricao` | `VARCHAR` | Etapa | sim | — | — |
| `previsao_inicio` | `DATE` | Previsão de Início | sim | — | — |
| `previsao_termino` | `DATE` | Previsão de Término | sim | — | — |
| `previsao_duracao` | `INTEGER` | Previsão de Duração (dias) | sim | sem formatação | — |
| `previsao_custo` | `DECIMAL(18,2)` | Previsão de Custo | sim | R$, 2 casas | — |
| `objeto` | `VARCHAR` | Objeto | sim | — | — |
| `objetivo` | `VARCHAR` | Objetivo | sim | — | — |
| `nao_escopo` | `VARCHAR` | Não Escopo | sim | — | — |
| `orgao_responsavel_id` | `BIGINT` | Órgão Responsável - ID | sim | sem formatação | — |
| `orgao_responsavel_sigla` | `VARCHAR` | Órgão Responsável (Sigla) | sim | — | — |
| `orgao_responsavel_descricao` | `VARCHAR` | Órgão Responsável | sim | — | — |
| `responsavel_id` | `BIGINT` | Responsável - ID | sim | sem formatação | — |
| `responsavel_nome_exibicao` | `VARCHAR` | Responsável | sim | — | — |
| `orgao_gestor_id` | `BIGINT` | Órgão Gestor - ID | sim | sem formatação | — |
| `orgao_gestor_sigla` | `VARCHAR` | Órgão Gestor (Sigla) | sim | — | — |
| `orgao_gestor_descricao` | `VARCHAR` | Órgão Gestor | sim | — | — |
| `meta_id` | `BIGINT` | ID da Meta | sim | sem formatação | — |
| `responsaveis_no_orgao_gestor` | `VARCHAR` | Responsáveis no Órgão Gestor | sim | — | — |
| `origem_tipo` | `VARCHAR` | Tipo de Origem | sim | — | — |
| `origem_outro` | `VARCHAR` | Origem (Outro) | sim | — | — |
| `secretario_responsavel` | `VARCHAR` | Secretário Responsável | sim | — | — |
| `secretario_executivo` | `VARCHAR` | Secretário Executivo | sim | — | — |
| `coordenador_ue` | `VARCHAR` | Coordenador da UE | sim | — | — |
| `data_aprovacao` | `DATE` | Data de Aprovação | sim | — | — |
| `data_revisao` | `DATE` | Data de Revisão | sim | — | — |
| `versao` | `VARCHAR` | Versão | sim | guard Excel | — |
| `arquivado` | `BOOLEAN` | Arquivado | sim | — | — |
| `iniciativa_id` | `BIGINT` | ID da Iniciativa | sim | sem formatação | — |
| `atividade_id` | `BIGINT` | ID da Atividade | sim | sem formatação | — |
| `meta_codigo` | `VARCHAR` | Código da Meta | sim | guard Excel | — |
| `resumo` | `VARCHAR` | Resumo | sim | — | — |
| `publico_alvo` | `VARCHAR` | Público Alvo | sim | — | — |
| `realizado_inicio` | `DATE` | Início Realizado | sim | — | — |
| `realizado_termino` | `DATE` | Término Realizado | sim | — | — |
| `realizado_custo` | `DECIMAL(18,2)` | Custo Realizado | sim | R$, 2 casas | — |
| `principais_etapas` | `VARCHAR` | Principais Etapas | sim | — | — |
| `eh_prioritario` | `BOOLEAN` | É Prioritário | sim | — | — |
| `atraso` | `INTEGER` | Atraso (dias) | sim | sem formatação | — |
| `em_atraso` | `BOOLEAN` | Em Atraso | sim | — | — |
| `tolerancia_atraso` | `INTEGER` | Tolerância de Atraso (dias) | sim | sem formatação | — |
| `projecao_termino` | `DATE` | Projeção de Término | sim | — | — |
| `realizado_duracao` | `INTEGER` | Duração Realizada (dias) | sim | sem formatação | — |
| `percentual_concluido` | `DOUBLE` | Percentual Concluído | sim | 2 casas, unidade `%` | — |
| `portfolio_nivel_maximo_tarefa` | `INTEGER` | Nível Máximo de Tarefa do Portfólio | sim | sem formatação | — |
| `meta__id` | `BIGINT` | Meta - ID | sim | sem formatação | — |
| `meta__codigo` | `VARCHAR` | Meta - Código | sim | guard Excel | — |
| `meta__titulo` | `VARCHAR` | Meta - Título | sim | — | — |
| `meta__pdm_id` | `BIGINT` | Meta - ID do PdM | sim | sem formatação | — |
| `meta__pdm_nome` | `VARCHAR` | Meta - PdM | sim | — | — |
| `fonte_recursos` | `VARCHAR` | Fontes de Recurso | sim | — | — |
| `premissas` | `VARCHAR` | Premissas | sim | — | — |
| `restricoes` | `VARCHAR` | Restrições | sim | — | — |
| `orgaos_participantes` | `VARCHAR` | Órgãos Participantes | sim | — | — |
| `status_traduzido` | `VARCHAR` | status-traduzido | sim | — | — |

[← todos os arquivos](../report-columns.md)
