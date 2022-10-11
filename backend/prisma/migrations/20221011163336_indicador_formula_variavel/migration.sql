/*
  Warnings:

  - The values [Diario,Semanal] on the enum `Periodicidade` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `agregador_id` on the `indicador` table. All the data in the column will be lost.
  - You are about to drop the column `janela_agregador` on the `indicador` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Periodicidade_new" AS ENUM ('Mensal', 'Bimestral', 'Trimestral', 'Quadrimestral', 'Semestral', 'Anual', 'Quinquenal', 'Secular');
ALTER TABLE "indicador" ALTER COLUMN "periodicidade" TYPE "Periodicidade_new" USING ("periodicidade"::text::"Periodicidade_new");
ALTER TABLE "variavel" ALTER COLUMN "periodicidade" TYPE "Periodicidade_new" USING ("periodicidade"::text::"Periodicidade_new");
ALTER TYPE "Periodicidade" RENAME TO "Periodicidade_old";
ALTER TYPE "Periodicidade_new" RENAME TO "Periodicidade";
DROP TYPE "Periodicidade_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "indicador" DROP CONSTRAINT "indicador_agregador_id_fkey";

-- AlterTable
ALTER TABLE "indicador" DROP COLUMN "agregador_id",
DROP COLUMN "janela_agregador",
ADD COLUMN     "calcular_acumulado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "formula" TEXT;

-- CreateTable
CREATE TABLE "indicador_formula_variavel" (
    "id" SERIAL NOT NULL,
    "indicador_id" INTEGER NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "janela" INTEGER NOT NULL,

    CONSTRAINT "indicador_formula_variavel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "indicador_formula_variavel" ADD CONSTRAINT "indicador_formula_variavel_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_formula_variavel" ADD CONSTRAINT "indicador_formula_variavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
