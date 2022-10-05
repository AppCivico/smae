/*
  Warnings:

  - The `prazo` column on the `etapa` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "etapa" ALTER COLUMN "inicio_previsto" DROP NOT NULL,
ALTER COLUMN "termino_previsto" DROP NOT NULL,
DROP COLUMN "prazo",
ADD COLUMN     "prazo" INTEGER;
