-- AlterEnum
ALTER TYPE "TipoAviso" ADD VALUE 'Nota';

-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'aviso_email_nota';

-- AlterTable
ALTER TABLE "aviso_email" ADD COLUMN     "nota_id" INTEGER;

-- AddForeignKey
ALTER TABLE "aviso_email" ADD CONSTRAINT "aviso_email_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "nota"("id") ON DELETE SET NULL ON UPDATE CASCADE;
