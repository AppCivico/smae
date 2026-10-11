-- CreateTable
CREATE TABLE "portfolio_compartilhamento_padrao" (
    "id" SERIAL NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "portfolio_compartilhado_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "portfolio_compartilhamento_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolio_compartilhamento_padrao_portfolio_id_idx" ON "portfolio_compartilhamento_padrao"("portfolio_id");

-- CreateIndex
CREATE INDEX "portfolio_compartilhamento_padrao_compartilhado_id_idx" ON "portfolio_compartilhamento_padrao"("portfolio_compartilhado_id");

-- AddForeignKey
ALTER TABLE "portfolio_compartilhamento_padrao" ADD CONSTRAINT "portfolio_compartilhamento_padrao_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_compartilhamento_padrao" ADD CONSTRAINT "portfolio_compartilhamento_padrao_compartilhado_id_fkey" FOREIGN KEY ("portfolio_compartilhado_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_compartilhamento_padrao" ADD CONSTRAINT "portfolio_compartilhamento_padrao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_compartilhamento_padrao" ADD CONSTRAINT "portfolio_compartilhamento_padrao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Um mesmo par só pode estar ativo uma vez (índice parcial: o Prisma não representa no schema).
CREATE UNIQUE INDEX "portfolio_compartilhamento_padrao_ativo_uniq"
    ON "portfolio_compartilhamento_padrao"("portfolio_id", "portfolio_compartilhado_id")
    WHERE "removido_em" IS NULL;
