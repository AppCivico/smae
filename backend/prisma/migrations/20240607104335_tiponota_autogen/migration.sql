-- AlterTable
ALTER TABLE "distribuicao_recurso" ADD COLUMN     "aviso_email_id" INTEGER,
ADD COLUMN     "nota_id" INTEGER;

-- AlterTable
ALTER TABLE "tipo_nota" ADD COLUMN     "autogerenciavel" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso" ADD CONSTRAINT "distribuicao_recurso_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "nota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso" ADD CONSTRAINT "distribuicao_recurso_aviso_email_id_fkey" FOREIGN KEY ("aviso_email_id") REFERENCES "aviso_email"("id") ON DELETE SET NULL ON UPDATE CASCADE;
