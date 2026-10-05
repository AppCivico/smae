-- DropIndex
DROP INDEX "nota_bloco_nota_id_idx";

-- CreateIndex
CREATE INDEX "bloco_nota_bloco_idx" ON "bloco_nota"("bloco");

-- CreateIndex
CREATE INDEX "nota_data_nota_rever_em_removido_em_idx" ON "nota"("data_nota", "rever_em", "removido_em");

-- CreateIndex
CREATE INDEX "nota_bloco_nota_id_removido_em_status_idx" ON "nota"("bloco_nota_id", "removido_em", "status");
