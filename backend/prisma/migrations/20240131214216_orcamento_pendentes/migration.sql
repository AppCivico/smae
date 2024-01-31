-- AlterTable
ALTER TABLE "meta_status_consolidado_cf" ADD COLUMN     "orcamento_pendentes" INTEGER[];

-- CreateIndex
CREATE INDEX "task_queue_criado_em_idx" ON "task_queue"("criado_em");
