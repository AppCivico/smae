-- DropForeignKey
ALTER TABLE "plano_acao" DROP CONSTRAINT "plano_acao_orgao_id_fkey";

-- AlterTable
ALTER TABLE "plano_acao" ALTER COLUMN "orgao_id" DROP NOT NULL,
ALTER COLUMN "responsavel" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "plano_acao" ADD CONSTRAINT "plano_acao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
