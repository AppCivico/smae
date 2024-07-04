/*
  Warnings:

  - Added the required column `orgao_id` to the `grupo_responsavel_variavel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orgao_id` to the `grupo_responsavel_variavel_pessoa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "grupo_responsavel_variavel" ADD COLUMN     "orgao_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "grupo_responsavel_variavel_pessoa" ADD COLUMN     "orgao_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "grupo_responsavel_variavel" ADD CONSTRAINT "grupo_responsavel_variavel_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_responsavel_variavel_pessoa" ADD CONSTRAINT "grupo_responsavel_variavel_pessoa_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
