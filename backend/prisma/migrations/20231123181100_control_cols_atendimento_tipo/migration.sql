-- AlterTable
ALTER TABLE "acompanhamento_tipo" ADD COLUMN     "criado_em" TIMESTAMP(3),
ADD COLUMN     "criado_por" INTEGER,
ADD COLUMN     "removido_em" TIMESTAMP(3),
ADD COLUMN     "removido_por" INTEGER;

-- AddForeignKey
ALTER TABLE "acompanhamento_tipo" ADD CONSTRAINT "acompanhamento_tipo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamento_tipo" ADD CONSTRAINT "acompanhamento_tipo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
