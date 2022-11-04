/*
  Warnings:

  - Added the required column `enviado_para_cp` to the `variavel_ciclo_fisico_documento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "variavel_ciclo_fisico_documento" ADD COLUMN     "enviado_para_cp" BOOLEAN NOT NULL;
