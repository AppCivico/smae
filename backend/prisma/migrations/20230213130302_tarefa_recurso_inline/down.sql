-- AlterTable
ALTER TABLE "portfolio" DROP COLUMN "nivel_maximo_tarefa";

-- AlterTable
ALTER TABLE "Tarefa" DROP COLUMN "descricao",
DROP COLUMN "recursos",
DROP COLUMN "tarefa";

-- CreateTable
CREATE TABLE "tarefa_recurso" (
    "id" SERIAL NOT NULL,
    "tarefa_id" INTEGER NOT NULL,
    "recurso" TEXT NOT NULL,

    CONSTRAINT "tarefa_recurso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tarefa_recurso" ADD CONSTRAINT "tarefa_recurso_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

