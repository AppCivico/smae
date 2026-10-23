# projetos_simplificado.csv

Uma linha por projeto, sem as colunas de órgão participante, premissa, restrição e fonte de recurso: o mesmo conteúdo de projetos.csv sem as linhas repetidas pelos joins.

Fontes que produzem este arquivo: `Projetos`

37 colunas.

Classe de linha: `RelProjetosSimplificadoCsvRow`

`projetos.csv` sem as colunas dos joins 1:N: uma linha por projeto.

| Coluna | Tipo | Rótulo | Formatação | Descrição |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | ID Projeto | sem formatação | — |
| `codigo` | `VARCHAR` | Código | — | — |
| `portfolio_id` | `INTEGER` | ID Portfólio | sem formatação | — |
| `nome` | `VARCHAR` | Nome do Projeto | — | — |
| `portfolio_titulo` | `VARCHAR` | Título do Portfólio | — | — |
| `etiquetas` | `VARCHAR` | Etiquetas | — | — |
| `status` | `VARCHAR` | Status (Banco) | — | — |
| `projeto_etapa` | `VARCHAR` | Projeto Etapa | — | — |
| `previsao_inicio` | `DATE` | Previsão de Início | — | — |
| `previsao_termino` | `DATE` | Previsão de Término | — | — |
| `previsao_duracao` | `INTEGER` | Previsão de Duração | sem formatação | — |
| `previsao_custo` | `DOUBLE` | Previsão de Custo | R$, 2 casas | — |
| `objeto` | `VARCHAR` | Objeto | — | — |
| `objetivo` | `VARCHAR` | Objetivo | — | — |
| `escopo` | `VARCHAR` | Escopo | — | — |
| `nao_escopo` | `VARCHAR` | Não Escopo | — | — |
| `orgao_responsavel__id` | `INTEGER` | ID Órgão Responsável | sem formatação | — |
| `orgao_responsavel__sigla` | `VARCHAR` | Sigla Órgão Responsável | — | — |
| `orgao_responsavel__descricao` | `VARCHAR` | Descrição Órgão Responsável | — | — |
| `responsavel__id` | `INTEGER` | ID Responsável | sem formatação | — |
| `responsavel__nome_exibicao` | `VARCHAR` | Nome do Responsável | — | — |
| `orgao_gestor__id` | `INTEGER` | ID Órgão Gestor | sem formatação | — |
| `orgao_gestor__sigla` | `VARCHAR` | Sigla Órgão Gestor | — | — |
| `orgao_gestor__descricao` | `VARCHAR` | Descrição Órgão Gestor | — | — |
| `meta_id` | `INTEGER` | ID Meta | sem formatação | — |
| `gestores` | `VARCHAR` | Gestores do Projeto | — | — |
| `portfolios_compartilhados_titulos` | `VARCHAR` | Portfólios Compartilhados | — | — |
| `secretario_responsavel` | `VARCHAR` | Secretário Responsável | — | — |
| `secretario_executivo` | `VARCHAR` | Secretário Executivo | — | — |
| `coordenador_ue` | `VARCHAR` | Coordenador UE | — | — |
| `data_aprovacao` | `DATE` | Data de Aprovação | — | — |
| `data_revisao` | `DATE` | Data de Revisão | — | — |
| `versao` | `VARCHAR` | Versão | — | — |
| `iniciativa_id` | `INTEGER` | ID Iniciativa | sem formatação | — |
| `atividade_id` | `INTEGER` | ID Atividade | sem formatação | — |
| `publico_alvo` | `VARCHAR` | Público-Alvo | — | — |
| `status_traduzido` | `VARCHAR` | Status | — | — |

[← todos os arquivos](../report-columns.md)
