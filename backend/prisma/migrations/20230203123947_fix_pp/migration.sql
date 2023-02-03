/*
  Warnings:

  - You are about to drop the column `custo_real` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `inicio_real` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `termino_real` on the `projeto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "custo_real",
DROP COLUMN "inicio_real",
DROP COLUMN "termino_real";
