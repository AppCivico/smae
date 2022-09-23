/*
  Warnings:

  - You are about to drop the column `descricao` on the `iniciativa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "iniciativa" DROP COLUMN "descricao",
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "contexto" TEXT;
