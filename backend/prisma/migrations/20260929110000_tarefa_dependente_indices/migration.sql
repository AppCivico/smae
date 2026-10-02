-- CreateIndex
CREATE INDEX "tarefa_dependente_tarefa_id_idx" ON "tarefa_dependente"("tarefa_id");

-- CreateIndex
CREATE INDEX "tarefa_dependente_dependencia_tarefa_id_idx" ON "tarefa_dependente"("dependencia_tarefa_id");
