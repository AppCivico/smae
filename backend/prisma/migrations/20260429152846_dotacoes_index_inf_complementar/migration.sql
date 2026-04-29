-- DropIndex
DROP INDEX "distribuicao_recurso_dotacao_distribuicao_recurso_id_idx";

-- DropIndex
DROP INDEX "transferencia_dotacao_transferencia_id_idx";

-- AlterTable
ALTER TABLE "distribuicao_recurso_solicitacao_ajuste" ADD COLUMN     "informacoes_complementares" TEXT;

-- CreateIndex
CREATE INDEX "distribuicao_recurso_dotacao_distribuicao_recurso_id_dotaca_idx" ON "distribuicao_recurso_dotacao"("distribuicao_recurso_id", "dotacao");

-- CreateIndex
CREATE INDEX "transferencia_dotacao_transferencia_id_dotacao_idx" ON "transferencia_dotacao"("transferencia_id", "dotacao");
