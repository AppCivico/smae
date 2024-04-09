-- AlterTable
ALTER TABLE "transferencia" ADD COLUMN     "workflow_id" INTEGER;

-- CreateTable
CREATE TABLE "transferencia_andamento" (
    "id" SERIAL NOT NULL,
    "transferencia_id" INTEGER NOT NULL,
    "workflow_etapa_id" INTEGER NOT NULL,
    "workflow_fase_id" INTEGER NOT NULL,
    "workflow_situacao_id" INTEGER NOT NULL,
    "orgao_responsavel_id" INTEGER,
    "pessoa_responsavel_id" INTEGER NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_termino" DATE,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "transferencia_andamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencia_andamento_tarefa" (
    "id" SERIAL NOT NULL,
    "transferencia_andamento_id" INTEGER NOT NULL,
    "workflow_tarefa_fluxo_id" INTEGER NOT NULL,
    "orgao_responsavel_id" INTEGER,
    "feito" BOOLEAN NOT NULL DEFAULT false,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "transferencia_andamento_tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transferencia_andamento_transferencia_id_workflow_etapa_id__idx" ON "transferencia_andamento"("transferencia_id", "workflow_etapa_id", "workflow_situacao_id");

-- AddForeignKey
ALTER TABLE "transferencia" ADD CONSTRAINT "transferencia_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "transferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_workflow_etapa_id_fkey" FOREIGN KEY ("workflow_etapa_id") REFERENCES "workflow_etapa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_workflow_fase_id_fkey" FOREIGN KEY ("workflow_fase_id") REFERENCES "workflow_fase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_workflow_situacao_id_fkey" FOREIGN KEY ("workflow_situacao_id") REFERENCES "workflow_situacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_orgao_responsavel_id_fkey" FOREIGN KEY ("orgao_responsavel_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_pessoa_responsavel_id_fkey" FOREIGN KEY ("pessoa_responsavel_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento_tarefa" ADD CONSTRAINT "transferencia_andamento_tarefa_transferencia_andamento_id_fkey" FOREIGN KEY ("transferencia_andamento_id") REFERENCES "transferencia_andamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento_tarefa" ADD CONSTRAINT "transferencia_andamento_tarefa_workflow_tarefa_fluxo_id_fkey" FOREIGN KEY ("workflow_tarefa_fluxo_id") REFERENCES "workflow_tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento_tarefa" ADD CONSTRAINT "transferencia_andamento_tarefa_orgao_responsavel_id_fkey" FOREIGN KEY ("orgao_responsavel_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento_tarefa" ADD CONSTRAINT "transferencia_andamento_tarefa_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento_tarefa" ADD CONSTRAINT "transferencia_andamento_tarefa_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_andamento_tarefa" ADD CONSTRAINT "transferencia_andamento_tarefa_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
