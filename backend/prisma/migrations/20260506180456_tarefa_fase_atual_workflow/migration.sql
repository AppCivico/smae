-- AlterTable
ALTER TABLE "tarefa" ADD COLUMN     "fase_atual_workflow" BOOLEAN;

-- Update tarefas que pertencem a uma transferência voluntária
-- e sua fase/tarefa do workflow seja a fase atual (com data de início, mas sem término)

-- Case 1: Tarefas com transferencia_fase_id
UPDATE "tarefa" t
SET "fase_atual_workflow" = true
WHERE t."transferencia_fase_id" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "transferencia_andamento" ta
    WHERE ta.id = t."transferencia_fase_id"
      AND ta."data_inicio" IS NOT NULL
      AND ta."data_termino" IS NULL
  );

-- Case 2: Tarefas com transferencia_tarefa_id
UPDATE "tarefa" t
SET "fase_atual_workflow" = true
WHERE t."transferencia_tarefa_id" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "transferencia_andamento_tarefa" tat
    JOIN "transferencia_andamento" ta ON ta.id = tat."transferencia_andamento_id"
    WHERE tat.id = t."transferencia_tarefa_id"
      AND ta."data_inicio" IS NOT NULL
      AND ta."data_termino" IS NULL
  );

-- Case 3: Tarefas filhas (ex: distribuição de recurso) cujo tarefa_pai tem fase_atual_workflow = true
-- Deve rodar após os Cases 1 e 2 para que os pais já estejam marcados
UPDATE "tarefa" t
SET "fase_atual_workflow" = true
WHERE t."transferencia_fase_id" IS NULL
  AND t."transferencia_tarefa_id" IS NULL
  AND t."tarefa_pai_id" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "tarefa" tp
    WHERE tp.id = t."tarefa_pai_id"
      AND tp."fase_atual_workflow" = true
  );