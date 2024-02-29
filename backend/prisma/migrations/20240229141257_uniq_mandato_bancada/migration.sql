/*
  Warnings:

  - A unique constraint covering the columns `[mandato_id,bancada_id]` on the table `mandato_bancada` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "mandato_bancada_mandato_id_bancada_id_key" ON "mandato_bancada"("mandato_id", "bancada_id");
