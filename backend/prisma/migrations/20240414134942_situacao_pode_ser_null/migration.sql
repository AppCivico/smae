-- DropForeignKey
ALTER TABLE "transferencia_andamento" DROP CONSTRAINT "transferencia_andamento_workflow_situacao_id_fkey";

-- AlterTable
ALTER TABLE "transferencia_andamento" ALTER COLUMN "workflow_situacao_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_workflow_situacao_id_fkey" FOREIGN KEY ("workflow_situacao_id") REFERENCES "workflow_situacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
