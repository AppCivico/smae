---
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: Cria uma novas paginas de formulario (schema Yup + componente Vue CriarEditar)
---

## Sua tarefa

$ARGUMENTS

Antes de começar, leia os seguintes arquivos de conhecimento do projeto:

- `.claude/project-knowledge/form-creation.md` — padrões de schema Yup e componente CriarEditar
- `.claude/project-knowledge/list-creation.md` — padrão de lista (SmaeTable, paginação, filtros)
- `.claude/project-knowledge/store-creation.md` — padrão de store Pinia (estado, actions, paginação)
- `.claude/project-knowledge/route-creation.md` — padrão de rotas (meta campos, props, lazy loading, permissões)

Se os argumentos não especificarem detalhes suficientes, pergunte:

1. **Nome da entidade** (ex: "Parceiro", "TipoDeAcao")
2. **Módulo/pasta** onde ficará em `src/views/` (ex: `parceiros`, `tiposDeAcao`)
3. **Campos do formulário**: nome, tipo (texto, número, data, select, autocomplete, boolean), obrigatório, label em português, tamanho máximo se aplicável
4. **Tem lista de itens dinâmica (FieldArray)?** Se sim, quais campos
5. **Nome da store** (ex: `useParceirosStore`)
6. **Nome da rota de listagem** para redirecionar após salvar (ex: `parceiros.listar`)
7. **A lista tem filtros?** Se sim: quais campos? Os filtros devem persistir na URL?
8. **A lista tem paginação?** (MenuPaginacao)

Depois de coletar as informações, crie os seguintes arquivos seguindo os padrões dos documentos lidos:

1. `src/consts/formSchemas/<entidade>.ts`
2. `src/stores/<modulo>.store.ts`
3. `src/views/<modulo>/<Entidade>Raiz.vue`
4. `src/views/<modulo>/<Entidade>Lista.vue`
5. `src/views/<modulo>/<Entidade>CriarEditar.vue`
6. Bloco de configuração de rota (para adicionar no arquivo de rotas do módulo)
