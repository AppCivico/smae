/*
  Warnings:

  - You are about to drop the column `remove_em` on the `relatorio` table. All the data in the column will be lost.
  - You are about to drop the column `remove_por` on the `relatorio` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "relatorio" DROP COLUMN "remove_em",
DROP COLUMN "remove_por",
ADD COLUMN     "removido_em" TIMESTAMPTZ(6),
ADD COLUMN     "removido_por" INTEGER;

-- CreateIndex
CREATE INDEX "relatorio_pdm_id_criado_em_removido_em_idx" ON "relatorio"("pdm_id", "criado_em", "removido_em");

-- CreateIndex
CREATE INDEX "relatorio_fonte_criado_em_idx" ON "relatorio"("fonte", "criado_em");

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
