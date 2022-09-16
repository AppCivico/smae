-- AlterTable
ALTER TABLE "pdm" ADD COLUMN     "arquivo_logo_id" INTEGER,
ADD COLUMN     "logo" TEXT;

-- AddForeignKey
ALTER TABLE "pdm" ADD CONSTRAINT "pdm_arquivo_logo_id_fkey" FOREIGN KEY ("arquivo_logo_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
