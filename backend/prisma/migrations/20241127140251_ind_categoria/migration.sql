-- CreateEnum
CREATE TYPE "IndicadorTipo" AS ENUM ('Numerico', 'Categorica');

-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "indicador_tipo" "IndicadorTipo" NOT NULL DEFAULT 'Numerico';
