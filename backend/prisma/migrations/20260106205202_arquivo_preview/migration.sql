
-- CreateEnum
CREATE TYPE "arquivo_preview_status" AS ENUM ('pendente', 'executando', 'concluido', 'erro', 'sem_suporte', 'pulado');

-- CreateEnum
CREATE TYPE "arquivo_preview_tipo" AS ENUM ('redimensionamento', 'conversao_pdf');

-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'gerar_preview_documento';

-- AlterTable
ALTER TABLE "arquivo" ADD COLUMN     "preview_arquivo_id" INTEGER,
ADD COLUMN     "preview_atualizado_em" TIMESTAMPTZ(6),
ADD COLUMN     "preview_criado_em" TIMESTAMPTZ(6),
ADD COLUMN     "preview_erro_mensagem" TEXT,
ADD COLUMN     "preview_status" "arquivo_preview_status" NOT NULL DEFAULT 'pulado',
ADD COLUMN     "preview_task_id" INTEGER,
ADD COLUMN     "preview_tipo" "arquivo_preview_tipo";

-- CreateIndex
CREATE UNIQUE INDEX "arquivo_preview_arquivo_id_key" ON "arquivo"("preview_arquivo_id");

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_preview_arquivo_id_fkey" FOREIGN KEY ("preview_arquivo_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_preview_task_id_fkey" FOREIGN KEY ("preview_task_id") REFERENCES "task_queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
