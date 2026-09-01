---
name: nova-lista
description: Use esta skill quando o usuário pedir para criar uma nova página de listagem, criar uma lista Vue com SmaeTable, ou criar a parte de lista de um CRUD para uma entidade.
version: 1.0.0
allowed-tools: Read, Write, AskUserQuestion
---

## Sua tarefa

$ARGUMENTS

Antes de começar, leia os seguintes arquivos de conhecimento do projeto:

- `.claude/project-knowledge/list-creation.md` — padrão de lista (SmaeTable, paginação, filtros, ordenação)
- `.claude/project-knowledge/store-creation.md` — padrão de store Pinia (estado, actions, paginação)
- `.claude/project-knowledge/route-creation.md` — padrão de rotas (meta campos, props, lazy loading, permissões)

Se os argumentos não especificarem detalhes suficientes, pergunte:

1. **Nome da entidade** (ex: "Parceiro", "TipoDeAcao")
2. **Módulo/pasta** onde ficará em `src/views/` (ex: `parceiros`, `tiposDeAcao`)
3. **Colunas da tabela**: quais campos exibir, com seus labels em português
4. **A listagem tem filtros?** Se sim: quais campos? Os filtros devem persistir na URL?
5. **A listagem tem paginação?** (MenuPaginacao)
6. **Nome da store** que fornece os dados (ex: `useParceirosStore`)
7. **Nome da rota de criação** para o botão "Novo item" (ex: `parceiros.criar`)

Depois de coletar as informações, crie os seguintes arquivos seguindo os padrões dos documentos lidos:

1. `src/views/<modulo>/<Entidade>Lista.vue`
2. `src/views/<modulo>/<Entidade>Raiz.vue` (se ainda não existir)
3. Bloco de configuração de rota (para adicionar no arquivo de rotas do módulo)
