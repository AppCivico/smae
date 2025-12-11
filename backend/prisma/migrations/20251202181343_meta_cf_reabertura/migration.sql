-- AlterTable
ALTER TABLE "meta_ciclo_fisico_fechamento" ADD COLUMN     "reaberto_em" TIMESTAMP(3),
ADD COLUMN     "reaberto_por" INTEGER;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento" ADD CONSTRAINT "meta_ciclo_fisico_fechamento_reaberto_por_fkey" FOREIGN KEY ("reaberto_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
