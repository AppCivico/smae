-- AlterTable
ALTER TABLE "serie_variavel" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "atualizado_por" INTEGER,
ALTER COLUMN "valor_percentual" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "serie_variavel" ADD CONSTRAINT "serie_variavel_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
