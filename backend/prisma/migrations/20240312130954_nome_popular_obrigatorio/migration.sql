/*
  Warnings:

  - Made the column `nome_popular` on table `parlamentar` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "parlamentar" ALTER COLUMN "nome_popular" SET NOT NULL;
