/*
  Warnings:

  - A unique constraint covering the columns `[cronograma_id,etapa_id]` on the table `cronograma_etapa` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cronograma_etapa_cronograma_id_etapa_id_key" ON "cronograma_etapa"("cronograma_id", "etapa_id");
