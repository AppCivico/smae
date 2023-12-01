-- AlterTable
ALTER TABLE "arquivo" ADD COLUMN     "atualizado_em" TIMESTAMP(3),
ADD COLUMN     "atualizado_por" INTEGER;

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
