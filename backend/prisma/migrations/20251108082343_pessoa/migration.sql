-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6),
ADD COLUMN     "atualizado_por" INTEGER;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
