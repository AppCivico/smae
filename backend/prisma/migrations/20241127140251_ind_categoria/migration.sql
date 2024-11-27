-- CreateEnum
CREATE TYPE "IndicadorTipo" AS ENUM ('Numerico', 'Categorica');

-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "indicador_tipo" "IndicadorTipo" NOT NULL DEFAULT 'Numerico';

update indicador set indicador_tipo = 'Categoria' where variavel_categoria_id is not null;
