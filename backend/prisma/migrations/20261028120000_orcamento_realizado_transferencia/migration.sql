-- AlterTable
ALTER TABLE "orcamento_realizado" ADD COLUMN "transferencia_id" INTEGER,
ADD COLUMN "distribuicao_recurso_id" INTEGER;

-- CreateIndex
CREATE INDEX "orcamento_realizado_transferencia_id_idx" ON "orcamento_realizado"("transferencia_id");

-- CreateIndex
CREATE INDEX "orcamento_realizado_distribuicao_recurso_id_idx" ON "orcamento_realizado"("distribuicao_recurso_id");

-- AddForeignKey
ALTER TABLE "orcamento_realizado" ADD CONSTRAINT "orcamento_realizado_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "transferencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_realizado" ADD CONSTRAINT "orcamento_realizado_distribuicao_recurso_id_fkey" FOREIGN KEY ("distribuicao_recurso_id") REFERENCES "distribuicao_recurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
