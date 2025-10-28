-- AlterTable
ALTER TABLE "distribuicao_recurso_vinculo" ADD COLUMN     "geo_localizacao_referencia_id" INTEGER,
ADD COLUMN     "orcamento_realizado_id" INTEGER;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_geo_localizacao_referencia_id_fkey" FOREIGN KEY ("geo_localizacao_referencia_id") REFERENCES "geo_localizacao_referencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_orcamento_realizado_id_fkey" FOREIGN KEY ("orcamento_realizado_id") REFERENCES "orcamento_realizado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
