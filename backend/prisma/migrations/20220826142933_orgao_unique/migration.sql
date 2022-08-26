/*
  Warnings:

  - A unique constraint covering the columns `[sigla]` on the table `orgao` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "orgao_sigla_key" ON "orgao"("sigla");
