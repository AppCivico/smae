-- CreateTable
CREATE TABLE "orcamento_previsto_zerado" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER,
    "meta_id" INTEGER,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "ano_referencia" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "orcamento_previsto_zerado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orcamento_previsto_zerado" ADD CONSTRAINT "orcamento_previsto_zerado_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_previsto_zerado" ADD CONSTRAINT "orcamento_previsto_zerado_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_previsto_zerado" ADD CONSTRAINT "orcamento_previsto_zerado_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_previsto_zerado" ADD CONSTRAINT "orcamento_previsto_zerado_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_previsto_zerado" ADD CONSTRAINT "orcamento_previsto_zerado_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_previsto_zerado" ADD CONSTRAINT "orcamento_previsto_zerado_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
