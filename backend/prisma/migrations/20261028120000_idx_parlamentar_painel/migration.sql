-- CreateIndex
CREATE INDEX "transferencia_parlamentar_parlamentar_id_idx" ON "transferencia_parlamentar"("parlamentar_id");

-- CreateIndex
CREATE INDEX "distribuicao_parlamentar_parlamentar_id_idx" ON "distribuicao_parlamentar"("parlamentar_id");

-- CreateIndex
CREATE INDEX "distribuicao_recurso_status_distribuicao_id_idx" ON "distribuicao_recurso_status"("distribuicao_id");
