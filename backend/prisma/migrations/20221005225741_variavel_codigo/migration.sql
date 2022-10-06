/*
  Warnings:

  - Added the required column `codigo` to the `variavel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "codigo" TEXT;

UPDATE "variavel" SET codigo = id;
ALTER TABLE "variavel" ALTER COLUMN "codigo" SET NOT NULL;
