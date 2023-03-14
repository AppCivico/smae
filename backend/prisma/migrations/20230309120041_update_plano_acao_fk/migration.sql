/*
  Warnings:

  - You are about to drop the column `risco_tarefa_id` on the `plano_acao` table. All the data in the column will be lost.
  - Added the required column `risco_id` to the `plano_acao` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "plano_acao" DROP CONSTRAINT "plano_acao_risco_tarefa_id_fkey";

-- DropIndex
DROP INDEX "plano_acao_risco_tarefa_id_idx";

-- AlterTable
ALTER TABLE "plano_acao" DROP COLUMN "risco_tarefa_id",
ADD COLUMN     "risco_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "plano_acao_risco_id_idx" ON "plano_acao"("risco_id");

-- AddForeignKey
ALTER TABLE "plano_acao" ADD CONSTRAINT "plano_acao_risco_id_fkey" FOREIGN KEY ("risco_id") REFERENCES "projeto_risco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
