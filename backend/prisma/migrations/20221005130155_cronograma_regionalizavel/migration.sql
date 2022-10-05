/*
  Warnings:

  - You are about to drop the column `por_regiao` on the `cronograma` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_regiao` on the `cronograma` table. All the data in the column will be lost.
  - Added the required column `regionalizavel` to the `cronograma` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cronograma"
DROP COLUMN "tipo_regiao",
ADD COLUMN     "nivel_regionalizacao" INTEGER;

ALTER TABLE "cronograma" RENAME "por_regiao" TO "regionalizavel";
