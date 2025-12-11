-- CreateEnum
CREATE TYPE "IndicadorPreviaOpcao" AS ENUM ('NaoPermitir', 'PermitirPreenchimento');

-- AlterEnum
ALTER TYPE "Serie" ADD VALUE 'Previa';

-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "indicador_previa_opcao" "IndicadorPreviaOpcao" NOT NULL DEFAULT 'NaoPermitir';

-- AlterTable
ALTER TABLE "serie_indicador" ADD COLUMN     "criado_por_previa" INTEGER,
ADD COLUMN     "data_criacao_previa" TIMESTAMP(3),
ADD COLUMN     "eh_previa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "elementos" JSONB,
ADD COLUMN     "previa_invalidada_em" TIMESTAMP(3);
