-- AlterTable
ALTER TABLE "projeto_registro_sei" ADD COLUMN     "atualizado_em" TIMESTAMP(3),
ADD COLUMN     "atualizado_por" INTEGER,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "removido_em" TIMESTAMP(3),
ADD COLUMN     "removido_por" INTEGER,
ALTER COLUMN "registro_sei_info" SET DEFAULT '{}',
ALTER COLUMN "criado_em" DROP NOT NULL,
ALTER COLUMN "criado_por" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "projeto_registro_sei" ADD CONSTRAINT "projeto_registro_sei_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_registro_sei" ADD CONSTRAINT "projeto_registro_sei_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_registro_sei" ADD CONSTRAINT "projeto_registro_sei_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

