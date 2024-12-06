-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "ha_avisos_data_fim" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "indicador_variavel" ADD COLUMN     "aviso_data_fim" BOOLEAN NOT NULL DEFAULT false;


