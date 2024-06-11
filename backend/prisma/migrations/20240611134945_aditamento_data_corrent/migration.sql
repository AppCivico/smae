/*
  Warnings:

  - Added the required column `data_vigencia_corrente` to the `distribuicao_recurso_aditamento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "distribuicao_recurso_aditamento" ADD COLUMN     "data_vigencia_corrente" DATE;

UPDATE distribuicao_recurso_aditamento SET data_vigencia_corrente = NOW();

ALTER TABLE distribuicao_recurso_aditamento ALTER COLUMN data_vigencia_corrente SET NOT NULL;