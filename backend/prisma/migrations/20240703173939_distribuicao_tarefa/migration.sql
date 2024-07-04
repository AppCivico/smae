-- AlterTable
ALTER TABLE "tarefa" ADD COLUMN     "distribuicao_recurso_id" INTEGER;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_distribuicao_recurso_id_fkey" FOREIGN KEY ("distribuicao_recurso_id") REFERENCES "distribuicao_recurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
