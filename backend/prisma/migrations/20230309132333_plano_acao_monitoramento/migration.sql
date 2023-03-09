/*
  Warnings:

  - Added the required column `ultima_revisao` to the `plano_acao_monitoramento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plano_acao_monitoramento" ADD COLUMN     "removido_em" TIMESTAMP(3),
ADD COLUMN     "removido_por" INTEGER,
ADD COLUMN     "ultima_revisao" BOOLEAN NOT NULL,
ALTER COLUMN "criado_em" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "plano_acao_monitoramento_plano_acao_id_data_afericao_idx" ON "plano_acao_monitoramento"("plano_acao_id", "data_afericao");

-- CreateIndex
CREATE INDEX "plano_acao_monitoramento_plano_acao_id_ultima_revisao_idx" ON "plano_acao_monitoramento"("plano_acao_id", "ultima_revisao");

-- AddForeignKey
ALTER TABLE "plano_acao_monitoramento" ADD CONSTRAINT "plano_acao_monitoramento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_acao_monitoramento" ADD CONSTRAINT "plano_acao_monitoramento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
