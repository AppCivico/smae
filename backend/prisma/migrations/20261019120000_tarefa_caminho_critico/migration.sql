-- AlterTable
ALTER TABLE "tarefa" ADD COLUMN     "eh_critica" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "folga" INTEGER,
ADD COLUMN     "inicio_mais_tarde" DATE,
ADD COLUMN     "termino_mais_tarde" DATE;

-- AlterTable
ALTER TABLE "tarefa_cronograma" ADD COLUMN     "caminho_critico" INTEGER[];

-- recalcula no próximo ciclo
UPDATE "tarefa_cronograma" SET "tarefas_proximo_recalculo" = now() WHERE "removido_em" IS NULL;
