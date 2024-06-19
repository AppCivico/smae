-- AlterTable
ALTER TABLE "distribuicao_recurso" ADD COLUMN     "custeio" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "investimento" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "transferencia" ADD COLUMN     "custeio" DECIMAL(15,2) DEFAULT 0,
ADD COLUMN     "investimento" DECIMAL(15,2) DEFAULT 0;
