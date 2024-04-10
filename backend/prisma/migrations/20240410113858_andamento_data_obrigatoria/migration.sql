/*
  Warnings:

  - Made the column `data_inicio` on table `transferencia_andamento` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "transferencia_andamento" ALTER COLUMN "data_inicio" SET NOT NULL;
