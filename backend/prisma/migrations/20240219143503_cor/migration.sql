-- AlterTable
ALTER TABLE "geo_camada_config" ADD COLUMN     "cor" TEXT;

-- AlterTable
ALTER TABLE "geo_localizacao_camada" RENAME CONSTRAINT "geo_endereco_regiao_pkey" TO "geo_localizacao_camada_pkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_camada" RENAME CONSTRAINT "geo_endereco_regiao_geo_camada_id_fkey" TO "geo_localizacao_camada_geo_camada_id_fkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_camada" RENAME CONSTRAINT "geo_endereco_regiao_geo_localizacao_id_fkey" TO "geo_localizacao_camada_geo_localizacao_id_fkey";
