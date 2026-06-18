-- AlterTable
ALTER TABLE "relatorio" ADD COLUMN "visibilidade_tipo" VARCHAR(40);

-- Backfill existing rows so the list/edit UI is consistent with the new scope selector.
-- `Restrito` rows are left NULL: they are system-generated (e.g. Projeto reports) and were
-- never chosen via a user-facing template.
UPDATE "relatorio" SET "visibilidade_tipo" = 'publico' WHERE "visibilidade" = 'Publico';
UPDATE "relatorio" SET "visibilidade_tipo" = 'privado' WHERE "visibilidade" = 'Privado';

-- Índices para a listagem de relatórios (findAll), agora que a tela será usada de forma intensiva.
-- Cobrimos TODOS os predicados que o filtro pode usar. As expressões abaixo replicam EXATAMENTE o
-- SQL que o Prisma gera para filtros de JSON (`(coluna #> ARRAY['chave']::text[])::jsonb`), para que
-- o planner consiga casar cada índice. Verificado com EXPLAIN: todos são utilizados.

-- (1) Caminho quente da paginação, para TODAS as visibilidades: filtra `removido_em IS NULL` +
-- `sistema IN (...)` e ordena por `criado_em DESC` com LIMIT.
CREATE INDEX "relatorio_sistema_criado_idx"
    ON "relatorio" ("sistema", "criado_em" DESC)
    WHERE "removido_em" IS NULL;

-- (2) Escopo "meu_orgao": casa `restrito_para.orgao_id` (igualdade) com o órgão do usuário.
CREATE INDEX "relatorio_restrito_orgao_id_idx"
    ON "relatorio" (((("restrito_para" #> ARRAY['orgao_id']::text[])::jsonb)::jsonb))
    WHERE "removido_em" IS NULL AND "visibilidade" = 'Restrito';

-- (3) Trava de órgão do "Gestor de Distribuição de Recurso": casa `parametros.orgao_id` (igualdade)
-- nos relatórios Públicos.
CREATE INDEX "relatorio_parametros_orgao_id_idx"
    ON "relatorio" (((("parametros" #> ARRAY['orgao_id']::text[])::jsonb)::jsonb))
    WHERE "removido_em" IS NULL AND "visibilidade" = 'Publico';

-- (4) Legado: `restrito_para.roles` (contém — operador @>), usado por relatórios gerados pelo
-- sistema. GIN de expressão sobre o sub-caminho, que é o que o Prisma usa no `array_contains`.
CREATE INDEX "relatorio_restrito_roles_gin"
    ON "relatorio" USING GIN ((("restrito_para" #> ARRAY['roles']::text[])::jsonb))
    WHERE "removido_em" IS NULL AND "visibilidade" = 'Restrito';

-- (5) Legado: `restrito_para.portfolio_orgao_ids` (contém — operador @>).
CREATE INDEX "relatorio_restrito_portfolio_gin"
    ON "relatorio" USING GIN ((("restrito_para" #> ARRAY['portfolio_orgao_ids']::text[])::jsonb))
    WHERE "removido_em" IS NULL AND "visibilidade" = 'Restrito';
