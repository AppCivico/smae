-- CreateTable
CREATE TABLE "portfolio_projeto_compartilhado" (
    "id" SERIAL NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMP(3),
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMP(3),

    CONSTRAINT "portfolio_projeto_compartilhado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "portfolio_projeto_compartilhado" ADD CONSTRAINT "portfolio_projeto_compartilhado_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projeto_compartilhado" ADD CONSTRAINT "portfolio_projeto_compartilhado_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projeto_compartilhado" ADD CONSTRAINT "portfolio_projeto_compartilhado_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projeto_compartilhado" ADD CONSTRAINT "portfolio_projeto_compartilhado_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projeto_compartilhado" ADD CONSTRAINT "portfolio_projeto_compartilhado_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
