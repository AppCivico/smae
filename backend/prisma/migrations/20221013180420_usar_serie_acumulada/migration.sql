/*
  Warnings:

  - You are about to drop the column `calcular_acumulado` on the `indicador` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "indicador" DROP COLUMN "calcular_acumulado",
ADD COLUMN     "acumulado_usa_formula" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "indicador_formula_variavel" ADD COLUMN     "usar_serie_acumulada" BOOLEAN NOT NULL DEFAULT false;
