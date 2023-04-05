-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "projecao_atraso" INTEGER,
ADD COLUMN     "projecao_inicio" DATE,
ADD COLUMN     "projecao_termino" DATE,
ALTER COLUMN "previsao_inicio" SET DATA TYPE DATE,
ALTER COLUMN "previsao_termino" SET DATA TYPE DATE,
ALTER COLUMN "realizado_inicio" SET DATA TYPE DATE,
ALTER COLUMN "realizado_termino" SET DATA TYPE DATE;
