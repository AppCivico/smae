/*
  Warnings:

  - You are about to drop the column `observacao` on the `indicador` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "indicador" DROP COLUMN "observacao",
ADD COLUMN     "complemento" TEXT;
