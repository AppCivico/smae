-- CreateTable
CREATE TABLE "portfolio_tag" (
    "id" SERIAL NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "portfolio_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_portfolio_tag" (
    "projeto_id" INTEGER NOT NULL,
    "portfolio_tag_id" INTEGER NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "projeto_portfolio_tag_pkey" PRIMARY KEY ("projeto_id","portfolio_tag_id")
);

-- AddForeignKey
ALTER TABLE "portfolio_tag" ADD CONSTRAINT "portfolio_tag_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_tag" ADD CONSTRAINT "portfolio_tag_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_tag" ADD CONSTRAINT "portfolio_tag_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_tag" ADD CONSTRAINT "portfolio_tag_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_portfolio_tag" ADD CONSTRAINT "projeto_portfolio_tag_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_portfolio_tag" ADD CONSTRAINT "projeto_portfolio_tag_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_portfolio_tag" ADD CONSTRAINT "projeto_portfolio_tag_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_portfolio_tag" ADD CONSTRAINT "projeto_portfolio_tag_portfolio_tag_id_fkey" FOREIGN KEY ("portfolio_tag_id") REFERENCES "portfolio_tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
