/*
  Warnings:

  - You are about to drop the column `locacao` on the `pessoa_fisica` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pessoa_fisica" DROP COLUMN "locacao",
ADD COLUMN     "lotacao" TEXT;
