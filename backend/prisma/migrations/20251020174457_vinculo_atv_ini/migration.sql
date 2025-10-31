-- AlterTable
ALTER TABLE "distribuicao_recurso_vinculo" ADD COLUMN     "atividade_id" INTEGER,
ADD COLUMN     "iniciativa_id" INTEGER;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
