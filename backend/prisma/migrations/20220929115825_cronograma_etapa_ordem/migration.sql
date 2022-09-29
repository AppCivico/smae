/*
  Warnings:

  - You are about to drop the column `ordem` on the `etapa` table. All the data in the column will be lost.
  - Added the required column `ordem` to the `cronograma_etapa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cronograma_etapa" ADD COLUMN     "ordem" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "etapa" DROP COLUMN "ordem";
