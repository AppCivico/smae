-- DropIndex
DROP INDEX "transferencia_andamento_transferencia_id_workflow_etapa_id__idx";

-- CreateIndex
CREATE INDEX "transferencia_andamento_transferencia_id_workflow_etapa_id__idx" ON "transferencia_andamento"("transferencia_id", "workflow_etapa_id", "workflow_fase_id");
