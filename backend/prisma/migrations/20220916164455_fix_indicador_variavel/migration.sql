/*
  Warnings:

  - Added the required column `variavel_id` to the `indicador_variavel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "indicador_variavel" ADD COLUMN     "variavel_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "indicador_variavel" ADD CONSTRAINT "indicador_variavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
