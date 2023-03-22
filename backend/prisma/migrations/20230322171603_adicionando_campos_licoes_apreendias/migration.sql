/*
  Warnings:

  - Added the required column `data_registro` to the `projeto_licao_aprendida` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsavel` to the `projeto_licao_aprendida` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "projeto_licao_aprendida" ADD COLUMN     "data_registro" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "responsavel" TEXT NOT NULL;
