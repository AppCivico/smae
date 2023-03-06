-- AlterTable
ALTER TABLE "tarefa" DROP COLUMN "ordem_topologica_inicio_planejado",
ADD COLUMN     "ordem_topologica_inicio_planejado" SMALLINT NOT NULL DEFAULT 0,
DROP COLUMN "ordem_topologica_termino_planejado",
ADD COLUMN     "ordem_topologica_termino_planejado" SMALLINT NOT NULL DEFAULT 0;

