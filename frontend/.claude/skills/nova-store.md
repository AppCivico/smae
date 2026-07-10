---
name: nova-store
description: Use esta skill quando o usuário pedir para criar uma nova store Pinia, criar store para uma entidade, ou mencionar criação de store com actions CRUD e paginação opcional.
version: 1.0.0
allowed-tools: Read, Write, AskUserQuestion
---

## Sua tarefa

$ARGUMENTS

Antes de começar, leia o seguinte arquivo de conhecimento do projeto:

- `.claude/project-knowledge/store-creation.md` — padrão de store Pinia (estado, actions, paginação, watch vs watchEffect)

Se os argumentos não especificarem detalhes suficientes, pergunte:

1. **Nome da entidade** (ex: "Parceiro", "TipoDeAcao")
2. **Endpoint base da API** (ex: `/parceiros`, `/tipos-de-acao`)
3. **A store precisa de paginação?** (MenuPaginacao)
4. **Quais actions são necessárias?** (buscarTudo, buscarItem, salvarItem, excluirItem — ou subconjunto)
5. **Algum getter específico além de `itensPorId`?**
6. **A store pertence a uma entidade mãe específica?** Algumas stores usam `route.meta.entidadeMãe` para selecionar o endpoint correto e recebem um sufixo no nome do arquivo. Os valores aceitos são:

   | `entidadeMãe` | Módulo | Sufixo no arquivo |
   |---|---|---|
   | `pdm` | PDM (Programa de Metas legado) | `Ps` |
   | `programaDeMetas` | Programa de Metas | `Ps` |
   | `planoSetorial` | Planos Setoriais | `Ps` |
   | `projeto` / `portfolio` | Gestão de Projetos | `Projeto` (prefixo) |
   | `mdo` / `obras` | Monitoramento de Obras | `Mdo` |
   | `TransferenciasVoluntarias` | Transferências Voluntárias | — |

   Stores com sufixo `Ps` normalmente suportam os três valores (`pdm`, `planoSetorial`, `programaDeMetas`) e usam uma função `caminhoParaApi(route.meta)` para selecionar o endpoint. Consulte o project-knowledge para o padrão completo.

Depois de coletar as informações, crie o arquivo seguindo os padrões do documento lido:

1. `src/stores/<entidade>.store.ts`
