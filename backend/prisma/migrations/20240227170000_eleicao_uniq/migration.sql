/*
  Warnings:

  - A unique constraint covering the columns `[tipo,ano]` on the table `eleicao` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "eleicao_tipo_ano_idx";

-- CreateIndex
CREATE UNIQUE INDEX "eleicao_tipo_ano_key" ON "eleicao"("tipo", "ano");
