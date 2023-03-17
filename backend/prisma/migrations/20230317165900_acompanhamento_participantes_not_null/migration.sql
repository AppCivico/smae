/*
  Warnings:

  - Made the column `participantes` on table `projeto_acompanhamento` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "projeto_acompanhamento" ALTER COLUMN "participantes" SET NOT NULL;
