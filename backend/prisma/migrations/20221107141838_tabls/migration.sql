-- CreateTable
CREATE TABLE "meta_ciclo_fisico_analise" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "informacoes_complementares" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "meta_ciclo_fisico_analise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_ciclo_fisico_analise_documento" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "meta_ciclo_fisico_analise_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_ciclo_fisico_risco" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "detalhamento" TEXT,
    "ponto_de_atencao" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "meta_ciclo_fisico_risco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_ciclo_fisico_fechamento" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "detalhamento" TEXT,
    "ponto_de_atencao" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "meta_ciclo_fisico_fechamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meta_ciclo_fisico_analise_meta_id_ultima_revisao_idx" ON "meta_ciclo_fisico_analise"("meta_id", "ultima_revisao");

-- CreateIndex
CREATE INDEX "meta_ciclo_fisico_analise_documento_ciclo_fisico_id_idx" ON "meta_ciclo_fisico_analise_documento"("ciclo_fisico_id");

-- CreateIndex
CREATE INDEX "meta_ciclo_fisico_risco_meta_id_ultima_revisao_idx" ON "meta_ciclo_fisico_risco"("meta_id", "ultima_revisao");

-- CreateIndex
CREATE INDEX "meta_ciclo_fisico_fechamento_meta_id_ultima_revisao_idx" ON "meta_ciclo_fisico_fechamento"("meta_id", "ultima_revisao");

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_analise" ADD CONSTRAINT "meta_ciclo_fisico_analise_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_analise" ADD CONSTRAINT "meta_ciclo_fisico_analise_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_analise" ADD CONSTRAINT "meta_ciclo_fisico_analise_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_analise" ADD CONSTRAINT "meta_ciclo_fisico_analise_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_analise_documento" ADD CONSTRAINT "meta_ciclo_fisico_analise_documento_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_analise_documento" ADD CONSTRAINT "meta_ciclo_fisico_analise_documento_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_analise_documento" ADD CONSTRAINT "meta_ciclo_fisico_analise_documento_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_analise_documento" ADD CONSTRAINT "meta_ciclo_fisico_analise_documento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_analise_documento" ADD CONSTRAINT "meta_ciclo_fisico_analise_documento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_risco" ADD CONSTRAINT "meta_ciclo_fisico_risco_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_risco" ADD CONSTRAINT "meta_ciclo_fisico_risco_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_risco" ADD CONSTRAINT "meta_ciclo_fisico_risco_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_risco" ADD CONSTRAINT "meta_ciclo_fisico_risco_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento" ADD CONSTRAINT "meta_ciclo_fisico_fechamento_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento" ADD CONSTRAINT "meta_ciclo_fisico_fechamento_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento" ADD CONSTRAINT "meta_ciclo_fisico_fechamento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento" ADD CONSTRAINT "meta_ciclo_fisico_fechamento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
