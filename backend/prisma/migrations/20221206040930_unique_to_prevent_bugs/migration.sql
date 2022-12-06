/*
  Warnings:

  - A unique constraint covering the columns `[ano_referencia,dotacao_processo]` on the table `dotacao_processo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ano_referencia,dotacao_processo_nota]` on the table `dotacao_processo_nota` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "dotacao_processo_ano_referencia_dotacao_processo_key" ON "dotacao_processo"("ano_referencia", "dotacao_processo");

-- CreateIndex
CREATE UNIQUE INDEX "dotacao_processo_nota_ano_referencia_dotacao_processo_nota_key" ON "dotacao_processo_nota"("ano_referencia", "dotacao_processo_nota");

-- CreateIndex
CREATE INDEX "orcamento_planejado_ano_referencia_meta_id_idx" ON "orcamento_planejado"("ano_referencia", "meta_id");

-- CreateIndex
CREATE INDEX "orcamento_planejado_ano_referencia_iniciativa_id_idx" ON "orcamento_planejado"("ano_referencia", "iniciativa_id");

-- CreateIndex
CREATE INDEX "orcamento_planejado_ano_referencia_atividade_id_idx" ON "orcamento_planejado"("ano_referencia", "atividade_id");

-- CreateIndex
CREATE INDEX "orcamento_realizado_ano_referencia_meta_id_idx" ON "orcamento_realizado"("ano_referencia", "meta_id");

-- CreateIndex
CREATE INDEX "orcamento_realizado_ano_referencia_iniciativa_id_idx" ON "orcamento_realizado"("ano_referencia", "iniciativa_id");

-- CreateIndex
CREATE INDEX "orcamento_realizado_ano_referencia_atividade_id_idx" ON "orcamento_realizado"("ano_referencia", "atividade_id");
