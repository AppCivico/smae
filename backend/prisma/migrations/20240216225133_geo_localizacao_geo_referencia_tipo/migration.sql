
delete from geo_localizacao;

ALTER TABLE "geo_localizacao" ADD COLUMN     "tipo" "GeoReferenciaTipo" NOT NULL;
