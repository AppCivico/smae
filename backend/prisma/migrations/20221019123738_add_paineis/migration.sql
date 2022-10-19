-- CreateTable
CREATE TABLE "ciclo_fisico" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "fase_atual" TEXT,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "ciclo_fisico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "painel" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "painel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "painel_versao" (
    "id" SERIAL NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "painel_id" INTEGER NOT NULL,
    "versao" INTEGER NOT NULL,

    CONSTRAINT "painel_versao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "painel_conteudo" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "indicador_id" INTEGER NOT NULL,
    "painel_versao_id" INTEGER NOT NULL,
    "peridiocidade" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "mostra_planejado" BOOLEAN,
    "mostra_acumulado" BOOLEAN,
    "acumulado_periodo" TEXT,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "painel_conteudo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "painel_conteudo_painel_versao_id_ordem_key" ON "painel_conteudo"("painel_versao_id", "ordem");

-- AddForeignKey
ALTER TABLE "ciclo_fisico" ADD CONSTRAINT "ciclo_fisico_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclo_fisico" ADD CONSTRAINT "ciclo_fisico_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclo_fisico" ADD CONSTRAINT "ciclo_fisico_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclo_fisico" ADD CONSTRAINT "ciclo_fisico_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel" ADD CONSTRAINT "painel_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel" ADD CONSTRAINT "painel_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel" ADD CONSTRAINT "painel_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_versao" ADD CONSTRAINT "painel_versao_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_versao" ADD CONSTRAINT "painel_versao_painel_id_fkey" FOREIGN KEY ("painel_id") REFERENCES "painel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_conteudo" ADD CONSTRAINT "painel_conteudo_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_conteudo" ADD CONSTRAINT "painel_conteudo_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_conteudo" ADD CONSTRAINT "painel_conteudo_painel_versao_id_fkey" FOREIGN KEY ("painel_versao_id") REFERENCES "painel_versao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
