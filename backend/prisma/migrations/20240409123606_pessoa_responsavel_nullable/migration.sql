-- DropForeignKey
ALTER TABLE "transferencia_andamento" DROP CONSTRAINT "transferencia_andamento_pessoa_responsavel_id_fkey";

-- AlterTable
ALTER TABLE "transferencia_andamento" ALTER COLUMN "pessoa_responsavel_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transferencia_andamento" ADD CONSTRAINT "transferencia_andamento_pessoa_responsavel_id_fkey" FOREIGN KEY ("pessoa_responsavel_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
