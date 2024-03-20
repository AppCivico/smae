-- AlterTable
ALTER TABLE "diretorio" ADD COLUMN     "transferencia_id" INTEGER;

-- CreateIndex
CREATE INDEX "diretorio_transferencia_id_idx" ON "diretorio"("transferencia_id");

-- AddForeignKey
ALTER TABLE "diretorio" ADD CONSTRAINT "diretorio_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "transferencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
