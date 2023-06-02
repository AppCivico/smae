/*
  Warnings:

  - Made the column `criado_por` on table `importacao_orcamento` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "importacao_orcamento" DROP CONSTRAINT "importacao_orcamento_criado_por_fkey";

-- AlterTable
ALTER TABLE "importacao_orcamento" ALTER COLUMN "criado_por" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "importacao_orcamento" ADD CONSTRAINT "importacao_orcamento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
