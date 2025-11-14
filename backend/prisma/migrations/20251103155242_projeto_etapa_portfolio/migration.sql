-- AlterTable
ALTER TABLE "projeto_etapa" ADD COLUMN     "etapa_padrao_id" INTEGER,
ADD COLUMN     "portfolio_id" INTEGER;

-- AddForeignKey
ALTER TABLE "projeto_etapa" ADD CONSTRAINT "projeto_etapa_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_etapa" ADD CONSTRAINT "projeto_etapa_etapa_padrao_id_fkey" FOREIGN KEY ("etapa_padrao_id") REFERENCES "projeto_etapa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
