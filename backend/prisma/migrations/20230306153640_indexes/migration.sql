/*
  Warnings:

  - A unique constraint covering the columns `[projeto_id]` on the table `projeto_numero_sequencial` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "plano_acao_risco_tarefa_id_idx" ON "plano_acao"("risco_tarefa_id");

-- CreateIndex
CREATE INDEX "portifolio_orgao_portifolio_id_idx" ON "portifolio_orgao"("portifolio_id");

-- CreateIndex
CREATE INDEX "projeto_removido_em_idx" ON "projeto"("removido_em");

-- CreateIndex
CREATE INDEX "projeto_documento_projeto_id_idx" ON "projeto_documento"("projeto_id");

-- CreateIndex
CREATE INDEX "projeto_fonte_recurso_projeto_id_idx" ON "projeto_fonte_recurso"("projeto_id");

-- CreateIndex
CREATE INDEX "projeto_licao_aprendida_projeto_id_idx" ON "projeto_licao_aprendida"("projeto_id");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_numero_sequencial_projeto_id_key" ON "projeto_numero_sequencial"("projeto_id");

-- CreateIndex
CREATE INDEX "projeto_orgao_participante_projeto_id_idx" ON "projeto_orgao_participante"("projeto_id");

-- CreateIndex
CREATE INDEX "projeto_premissa_projeto_id_idx" ON "projeto_premissa"("projeto_id");

-- CreateIndex
CREATE INDEX "projeto_registro_sei_projeto_id_idx" ON "projeto_registro_sei"("projeto_id");

-- CreateIndex
CREATE INDEX "projeto_relatorio_fila_projeto_id_idx" ON "projeto_relatorio_fila"("projeto_id");

-- CreateIndex
CREATE INDEX "projeto_restricao_projeto_id_idx" ON "projeto_restricao"("projeto_id");

-- CreateIndex
CREATE INDEX "projeto_risco_projeto_id_idx" ON "projeto_risco"("projeto_id");

-- CreateIndex
CREATE INDEX "risco_tarefa_tarefa_id_idx" ON "risco_tarefa"("tarefa_id");

-- CreateIndex
CREATE INDEX "risco_tarefa_projeto_risco_id_idx" ON "risco_tarefa"("projeto_risco_id");
