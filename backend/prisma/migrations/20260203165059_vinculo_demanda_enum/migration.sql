-- AlterEnum
ALTER TYPE "CampoVinculo" ADD VALUE 'Demanda';

-- AlterTable
ALTER TABLE "distribuicao_recurso_vinculo" ADD COLUMN     "demanda_id" INTEGER;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "demanda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
