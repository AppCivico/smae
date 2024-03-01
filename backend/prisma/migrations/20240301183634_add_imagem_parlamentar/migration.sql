-- AlterTable
ALTER TABLE "parlamentar" ADD COLUMN     "foto_upload_id" INTEGER;

-- AddForeignKey
ALTER TABLE "parlamentar" ADD CONSTRAINT "parlamentar_foto_upload_id_fkey" FOREIGN KEY ("foto_upload_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
