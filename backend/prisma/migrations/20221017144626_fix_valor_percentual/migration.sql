BEGIN;
-- AlterTable
ALTER TABLE "indicador"
    ADD COLUMN "acumulado_valor_base" DECIMAL(65, 30);
-- AlterTable
ALTER TABLE "serie_indicador"
    DROP COLUMN "valor_percentual",
    ALTER COLUMN "valor_nominal" SET DATA TYPE DOUBLE PRECISION;
-- AlterTable
ALTER TABLE "serie_variavel"
    DROP COLUMN "valor_percentual";





COMMIT;

