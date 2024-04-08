-- CreateTable
CREATE TABLE "fluxo" (
    "id" SERIAL NOT NULL,
    "workflow_id" INTEGER NOT NULL,
    "fluxo_etapa_de_id" INTEGER NOT NULL,
    "fluxo_etapa_para_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "fluxo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fluxo_workflow_id_fluxo_etapa_de_id_fluxo_etapa_para_id_idx" ON "fluxo"("workflow_id", "fluxo_etapa_de_id", "fluxo_etapa_para_id");

-- AddForeignKey
ALTER TABLE "fluxo" ADD CONSTRAINT "fluxo_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo" ADD CONSTRAINT "fluxo_fluxo_etapa_de_id_fkey" FOREIGN KEY ("fluxo_etapa_de_id") REFERENCES "workflow_etapa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo" ADD CONSTRAINT "fluxo_fluxo_etapa_para_id_fkey" FOREIGN KEY ("fluxo_etapa_para_id") REFERENCES "workflow_etapa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo" ADD CONSTRAINT "fluxo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo" ADD CONSTRAINT "fluxo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo" ADD CONSTRAINT "fluxo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
