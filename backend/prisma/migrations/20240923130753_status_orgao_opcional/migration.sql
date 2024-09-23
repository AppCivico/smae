-- DropForeignKey
ALTER TABLE "distribuicao_recurso_status" DROP CONSTRAINT "distribuicao_recurso_status_orgao_responsavel_id_fkey";

-- AlterTable
ALTER TABLE "distribuicao_recurso_status" ALTER COLUMN "orgao_responsavel_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_orgao_responsavel_id_fkey" FOREIGN KEY ("orgao_responsavel_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
