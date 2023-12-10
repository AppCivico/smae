-- CreateTable
CREATE TABLE "formula_composta_ciclo_fisico_qualitativo" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "formula_composta_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "analise_qualitativa" TEXT,
    "enviado_para_cp" BOOLEAN NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "formula_composta_ciclo_fisico_qualitativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_composta_ciclo_fisico_documento" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "formula_composta_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "formula_composta_ciclo_fisico_documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "formula_composta_ciclo_fisico_qualitativo_meta_id_ultima_re_idx" ON "formula_composta_ciclo_fisico_qualitativo"("meta_id", "ultima_revisao");

-- CreateIndex
CREATE INDEX "formula_composta_ciclo_fisico_documento_ciclo_fisico_id_for_idx" ON "formula_composta_ciclo_fisico_documento"("ciclo_fisico_id", "formula_composta_id");

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_qualitativo" ADD CONSTRAINT "formula_composta_ciclo_fisico_qualitativo_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_qualitativo" ADD CONSTRAINT "formula_composta_ciclo_fisico_qualitativo_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_qualitativo" ADD CONSTRAINT "formula_composta_ciclo_fisico_qualitativo_formula_composta_fkey" FOREIGN KEY ("formula_composta_id") REFERENCES "formula_composta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_qualitativo" ADD CONSTRAINT "formula_composta_ciclo_fisico_qualitativo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_qualitativo" ADD CONSTRAINT "formula_composta_ciclo_fisico_qualitativo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_documento" ADD CONSTRAINT "formula_composta_ciclo_fisico_documento_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_documento" ADD CONSTRAINT "formula_composta_ciclo_fisico_documento_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_documento" ADD CONSTRAINT "formula_composta_ciclo_fisico_documento_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_documento" ADD CONSTRAINT "formula_composta_ciclo_fisico_documento_formula_composta_i_fkey" FOREIGN KEY ("formula_composta_id") REFERENCES "formula_composta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_documento" ADD CONSTRAINT "formula_composta_ciclo_fisico_documento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_ciclo_fisico_documento" ADD CONSTRAINT "formula_composta_ciclo_fisico_documento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
