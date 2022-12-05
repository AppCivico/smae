/*
  Warnings:

  - A unique constraint covering the columns `[ano_referencia,dotacao_processo]` on the table `dotacao_processo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ano_referencia,dotacao_processo_nota]` on the table `dotacao_processo_nota` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "dotacao_processo_ano_referencia_dotacao_dotacao_processo_key";

-- DropIndex
DROP INDEX "dotacao_processo_nota_ano_referencia_dotacao_dotacao_proces_key";

-- CreateIndex
CREATE UNIQUE INDEX "dotacao_processo_ano_referencia_dotacao_processo_key" ON "dotacao_processo"("ano_referencia", "dotacao_processo");

-- CreateIndex
CREATE UNIQUE INDEX "dotacao_processo_nota_ano_referencia_dotacao_processo_nota_key" ON "dotacao_processo_nota"("ano_referencia", "dotacao_processo_nota");
