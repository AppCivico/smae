/*
  Warnings:

  - A unique constraint covering the columns `[versao_anterior_id]` on the table `meta_orcamento` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "meta_orcamento" ADD COLUMN     "versao_anterior_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "meta_orcamento_versao_anterior_id_key" ON "meta_orcamento"("versao_anterior_id");

-- AddForeignKey
ALTER TABLE "meta_orcamento" ADD CONSTRAINT "meta_orcamento_versao_anterior_id_fkey" FOREIGN KEY ("versao_anterior_id") REFERENCES "meta_orcamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
