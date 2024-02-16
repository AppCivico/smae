alter table geo_endereco_regiao rename to geo_localizacao_camada;
delete from geo_localizacao_camada;
delete from geo_localizacao;

ALTER TABLE "geo_localizacao" ADD COLUMN     "tipo" "GeoReferenciaTipo" NOT NULL;
