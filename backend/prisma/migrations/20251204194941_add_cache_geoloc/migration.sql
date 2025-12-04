-- AlterTable
ALTER TABLE "geo_localizacao" ADD COLUMN     "calc_regioes_nivel_1" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "calc_regioes_nivel_2" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "calc_regioes_nivel_3" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
