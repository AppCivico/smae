-- AlterTable
ALTER TABLE "diretorio" ADD COLUMN     "pdm_id" INTEGER;

-- AddForeignKey
ALTER TABLE "diretorio" ADD CONSTRAINT "diretorio_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
