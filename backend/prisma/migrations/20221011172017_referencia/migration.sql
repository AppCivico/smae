/*
  Warnings:

  - A unique constraint covering the columns `[indicador_id,referencia]` on the table `indicador_formula_variavel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referencia` to the `indicador_formula_variavel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "indicador_formula_variavel" ADD COLUMN     "referencia" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "indicador_formula_variavel_indicador_id_referencia_key" ON "indicador_formula_variavel"("indicador_id", "referencia");
