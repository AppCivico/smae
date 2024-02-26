/*
  Warnings:

  - Added the required column `sigla` to the `bancada` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bancada" ADD COLUMN     "sigla" TEXT NOT NULL,
ALTER COLUMN "descricao" DROP NOT NULL;
