-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "casas_decimais" SMALLINT;

-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "fim_medicao" DATE,
ADD COLUMN     "inicio_medicao" DATE;
