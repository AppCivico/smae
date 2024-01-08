-- AlterTable
ALTER TABLE "projeto_acompanhamento_item" ADD COLUMN     "atualizado_em" TIMESTAMP(3),
ADD COLUMN     "atualizado_por" INTEGER,
ADD COLUMN     "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criado_por" INTEGER,
ADD COLUMN     "removido_em" TIMESTAMP(3),
ADD COLUMN     "removido_por" INTEGER;

-- AddForeignKey
ALTER TABLE "projeto_acompanhamento_item" ADD CONSTRAINT "projeto_acompanhamento_item_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_acompanhamento_item" ADD CONSTRAINT "projeto_acompanhamento_item_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_acompanhamento_item" ADD CONSTRAINT "projeto_acompanhamento_item_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
