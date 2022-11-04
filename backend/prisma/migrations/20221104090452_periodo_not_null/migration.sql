/*
  Warnings:

  - Made the column `periodo` on table `painel_conteudo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
UPDATE "painel_conteudo" SET periodo = 'Todos' WHERE periodo IS NULL;
ALTER TABLE "painel_conteudo" ALTER COLUMN "periodo" SET NOT NULL;
