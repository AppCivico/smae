/*
  Warnings:

  - Added the required column `codigo` to the `projeto_risco` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "projeto_risco" ADD COLUMN     "codigo" TEXT NOT NULL;
