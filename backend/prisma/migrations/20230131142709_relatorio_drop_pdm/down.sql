-- DropForeignKey
ALTER TABLE "relatorio" DROP CONSTRAINT "relatorio_pdm_id_fkey";

-- AlterTable
ALTER TABLE "relatorio" ALTER COLUMN "pdm_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

