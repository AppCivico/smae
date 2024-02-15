

DELETE from geo_camada_regiao;
DELETE from geo_camada;

-- AlterTable
ALTER TABLE "geo_camada" ADD COLUMN     "geo_camada_config" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "geo_camada_config" ADD COLUMN     "descricao" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "geo_camada" ADD CONSTRAINT "geo_camada_geo_camada_config_fkey" FOREIGN KEY ("geo_camada_config") REFERENCES "geo_camada_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
