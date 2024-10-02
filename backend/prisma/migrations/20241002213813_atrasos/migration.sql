-- AlterEnum
ALTER TYPE "TipoRelatorio" ADD VALUE 'Mensal';

-- AlterTable
ALTER TABLE "variavel_ciclo_corrente" ADD COLUMN     "atrasos" DATE[] DEFAULT ARRAY[]::DATE[],
ADD COLUMN     "prazo" DATE;
