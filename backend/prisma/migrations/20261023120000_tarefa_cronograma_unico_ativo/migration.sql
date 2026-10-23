-- Índice parcial: o Prisma não representa no schema, por isso fica só aqui.
CREATE UNIQUE INDEX "tarefa_cronograma_projeto_id_ativo_uniq" ON "tarefa_cronograma"("projeto_id") WHERE "projeto_id" IS NOT NULL AND "removido_em" IS NULL;
CREATE UNIQUE INDEX "tarefa_cronograma_transferencia_id_ativo_uniq" ON "tarefa_cronograma"("transferencia_id") WHERE "transferencia_id" IS NOT NULL AND "removido_em" IS NULL;
