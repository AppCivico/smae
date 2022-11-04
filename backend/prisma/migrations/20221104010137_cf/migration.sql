/*
  Warnings:

  - You are about to drop the column `diretamente_do_indicador_da_meta` on the `variavel_ciclo_fisico_documento` table. All the data in the column will be lost.
  - You are about to drop the column `diretamente_do_indicador_da_meta` on the `variavel_ciclo_fisico_qualitativo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "variavel_ciclo_fisico_documento" DROP COLUMN "diretamente_do_indicador_da_meta";

-- AlterTable
ALTER TABLE "variavel_ciclo_fisico_qualitativo" DROP COLUMN "diretamente_do_indicador_da_meta",
ALTER COLUMN "analise_qualitativa" DROP NOT NULL;
