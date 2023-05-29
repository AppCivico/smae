-- CreateTable
CREATE TABLE "importacao_orcamento" (
    "id" SERIAL NOT NULL,
    "arquivo_id" INTEGER,
    "relatorio_id" INTEGER,
    "pdm_id" INTEGER,
    "portfolio_id" INTEGER,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processado_errmsg" TEXT,
    "linhas_importadas" INTEGER,

    CONSTRAINT "importacao_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "importacao_orcamento_criado_em_pdm_id_idx" ON "importacao_orcamento"("criado_em", "pdm_id");

-- CreateIndex
CREATE INDEX "importacao_orcamento_criado_em_portfolio_id_idx" ON "importacao_orcamento"("criado_em", "portfolio_id");

-- AddForeignKey
ALTER TABLE "importacao_orcamento" ADD CONSTRAINT "importacao_orcamento_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacao_orcamento" ADD CONSTRAINT "importacao_orcamento_relatorio_id_fkey" FOREIGN KEY ("relatorio_id") REFERENCES "relatorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacao_orcamento" ADD CONSTRAINT "importacao_orcamento_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacao_orcamento" ADD CONSTRAINT "importacao_orcamento_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacao_orcamento" ADD CONSTRAINT "importacao_orcamento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
