/*
  Warnings:

  - A unique constraint covering the columns `[serie,variavel_id,data_valor]` on the table `serie_variavel` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "idx_serie_variavel_variavel_id_data_valor";

-- CreateIndex
CREATE UNIQUE INDEX "idx_serie_variavel_variavel_id_data_valor" ON "serie_variavel"("serie", "variavel_id", "data_valor");


