-- CreateIndex
CREATE INDEX "transferencia_andamento_tarefa_transferencia_andamento_id_w_idx" ON "transferencia_andamento_tarefa"("transferencia_andamento_id", "workflow_tarefa_fluxo_id");
