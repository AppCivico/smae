
-- AlterTable
ALTER TABLE "distribuicao_recurso_aditamento" ADD COLUMN     "data_vigencia_corrente" DATE;

UPDATE distribuicao_recurso_aditamento SET data_vigencia_corrente = NOW();

ALTER TABLE distribuicao_recurso_aditamento ALTER COLUMN data_vigencia_corrente SET NOT NULL;