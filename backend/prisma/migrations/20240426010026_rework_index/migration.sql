-- DropIndex
DROP INDEX "nota_bloco_nota_id_removido_em_status_idx";

-- DropIndex
DROP INDEX "nota_data_nota_rever_em_removido_em_idx";

-- CreateIndex
CREATE INDEX "nota_status_removido_em_idx" ON "nota"("status", "removido_em");
