/*
  Warnings:

  - A unique constraint covering the columns `[transferencia_fase_id]` on the table `tarefa` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transferencia_tarefa_id]` on the table `tarefa` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tarefa" ADD COLUMN     "transferencia_fase_id" INTEGER,
ADD COLUMN     "transferencia_tarefa_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "tarefa_transferencia_fase_id_key" ON "tarefa"("transferencia_fase_id");

-- CreateIndex
CREATE UNIQUE INDEX "tarefa_transferencia_tarefa_id_key" ON "tarefa"("transferencia_tarefa_id");

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_transferencia_fase_id_fkey" FOREIGN KEY ("transferencia_fase_id") REFERENCES "transferencia_andamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_transferencia_tarefa_id_fkey" FOREIGN KEY ("transferencia_tarefa_id") REFERENCES "transferencia_andamento_tarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
