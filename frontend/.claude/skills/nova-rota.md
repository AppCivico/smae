---
name: nova-rota
description: Use esta skill quando o usuário pedir para criar rotas Vue Router, adicionar um módulo ao router, criar arquivo de rotas, configurar breadcrumbs, permissões ou menu lateral para um módulo.
version: 1.0.0
allowed-tools: Read, Write, Edit, AskUserQuestion
---

## Sua tarefa

$ARGUMENTS

Antes de começar, leia o seguinte arquivo de conhecimento do projeto:

- `.claude/project-knowledge/route-creation.md` — estrutura de rotas, meta campos, props, lazy loading, permissões, breadcrumbs

Se os argumentos não especificarem detalhes suficientes, pergunte:

1. **Nome do módulo** (ex: `parceiros`, `tiposDeAcao`)
2. **Entidade principal** (ex: `Parceiro`, `TipoDeAcao`)
3. **Path base** da rota (ex: `/parceiros`)
4. **Permissões necessárias** (`limitarÀsPermissões`) — quais strings de permissão?
5. **Operações disponíveis**: listar, criar, editar, detalhar?
6. **Precisa de menu lateral?** Se sim, o módulo tem ícone SVG?
7. **entidadeMãe** (contexto do módulo: `pdm`, `projeto`, `mdo`, `planoSetorial`)
8. **O módulo já existe em `src/router/index.js`?** Se não, precisamos registrá-lo lá também.

Depois de coletar as informações, crie/edite os seguintes arquivos seguindo os padrões do documento lido:

1. `src/router/<modulo>.js` — arquivo de rotas do módulo
2. `src/router/index.js` — registrar o novo módulo (se ainda não registrado)
