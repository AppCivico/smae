-- AlterTable
ALTER TABLE "plano_acao_monitoramento" ADD COLUMN     "atualizado_em" TIMESTAMP(3),
ADD COLUMN     "atualizado_por" INTEGER;

-- AddForeignKey
ALTER TABLE "plano_acao_monitoramento" ADD CONSTRAINT "plano_acao_monitoramento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
