-- AlterTable
ALTER TABLE "orcamento_realizado_item" ADD COLUMN     "sobrescrito_em" TIMESTAMP(3),
ADD COLUMN     "sobrescrito_por" INTEGER;

-- AddForeignKey
ALTER TABLE "orcamento_realizado_item" ADD CONSTRAINT "orcamento_realizado_item_sobrescrito_por_fkey" FOREIGN KEY ("sobrescrito_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
