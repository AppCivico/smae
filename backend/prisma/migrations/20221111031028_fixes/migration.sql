-- AlterTable
ALTER TABLE "serie_variavel" ALTER COLUMN "conferida" SET DEFAULT true;

-- AlterTable
ALTER TABLE "status_variavel_ciclo_fisico" ADD COLUMN     "conferida" BOOLEAN NOT NULL DEFAULT false;
