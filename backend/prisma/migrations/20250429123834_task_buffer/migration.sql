-- CreateTable
CREATE TABLE "task_buffer" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_buffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_buffer_task_id_key" ON "task_buffer"("task_id");

-- AddForeignKey
ALTER TABLE "task_buffer" ADD CONSTRAINT "task_buffer_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task_queue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "atualizacao_em_lote" ADD COLUMN     "relatorio_arquivo_id" INTEGER;

-- AddForeignKey
ALTER TABLE "atualizacao_em_lote" ADD CONSTRAINT "atualizacao_em_lote_relatorio_arquivo_id_fkey" FOREIGN KEY ("relatorio_arquivo_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
