-- AlterTable
ALTER TABLE "atualizacao_em_lote" ADD COLUMN     "orgao_id" INTEGER;

-- AddForeignKey
ALTER TABLE "atualizacao_em_lote" ADD CONSTRAINT "atualizacao_em_lote_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
