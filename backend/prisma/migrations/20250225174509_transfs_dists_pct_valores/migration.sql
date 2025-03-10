-- AlterTable
ALTER TABLE "distribuicao_recurso" ADD COLUMN     "pct_custeio" DOUBLE PRECISION,
ADD COLUMN     "pct_investimento" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "transferencia" ADD COLUMN     "pct_custeio" DOUBLE PRECISION,
ADD COLUMN     "pct_investimento" DOUBLE PRECISION;
