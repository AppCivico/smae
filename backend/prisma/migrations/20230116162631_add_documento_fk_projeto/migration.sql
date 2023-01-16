-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "status" TEXT;

-- AddForeignKey
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
