/*
  Warnings:

  - Added the required column `nome` to the `workflow` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workflow" ADD COLUMN     "nome" TEXT NOT NULL;
