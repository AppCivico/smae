-- AlterTable
ALTER TABLE "tarefa" ADD COLUMN     "atualizado_em_usuario" TIMESTAMP(3),
ADD COLUMN     "atualizado_por" INTEGER;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
