/*
  Warnings:

  - Added the required column `ordem` to the `fluxo_tarefa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "fluxo_tarefa" ADD COLUMN     "ordem" INTEGER NOT NULL;
