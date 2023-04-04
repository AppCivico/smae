/*
  Warnings:

  - You are about to drop the column `percentual_concluido` on the `projeto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "percentual_concluido",
ADD COLUMN     "em_atraso" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tolerancia_atraso" INTEGER NOT NULL DEFAULT 0;
