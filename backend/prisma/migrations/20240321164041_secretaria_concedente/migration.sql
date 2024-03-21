-- DropForeignKey
ALTER TABLE "transferencia" DROP CONSTRAINT "transferencia_secretaria_concedente_id_fkey";

-- AlterTable
ALTER TABLE "transferencia" ADD COLUMN     "secretaria_concedente_str" TEXT,
ALTER COLUMN "secretaria_concedente_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transferencia" ADD CONSTRAINT "transferencia_secretaria_concedente_id_fkey" FOREIGN KEY ("secretaria_concedente_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
