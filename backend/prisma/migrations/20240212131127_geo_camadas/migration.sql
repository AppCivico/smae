-- CreateEnum
CREATE TYPE "GeoReferenciaTipo" AS ENUM ('Endereco');

-- AlterTable
ALTER TABLE "regiao" ALTER COLUMN "codigo" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "geo_localizacao" (
    "id" SERIAL NOT NULL,
    "endereco_exibicao" TEXT NOT NULL,
    "geom_geojson" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_localizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_camada_config" (
    "id" SERIAL NOT NULL,
    "tipo_camada" TEXT NOT NULL,
    "chave_camada" TEXT NOT NULL,
    "titulo_camada" TEXT NOT NULL,
    "nivel_regionalizacao" INTEGER,
    "simplificar_em" DOUBLE PRECISION,

    CONSTRAINT "geo_camada_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_camada" (
    "id" SERIAL NOT NULL,
    "tipo_camada" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "nivel_regionalizacao" INTEGER,
    "geom_geojson_original" JSONB NOT NULL,
    "geom_geojson" JSONB NOT NULL,

    CONSTRAINT "geo_camada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_camada_regiao" (
    "id" SERIAL NOT NULL,
    "regiao_id" INTEGER NOT NULL,
    "geo_camada_id" INTEGER NOT NULL,

    CONSTRAINT "geo_camada_regiao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_endereco_regiao" (
    "id" SERIAL NOT NULL,
    "geo_localizacao_id" INTEGER NOT NULL,
    "geo_camada_id" INTEGER NOT NULL,

    CONSTRAINT "geo_endereco_regiao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_localicao_referencia" (
    "id" SERIAL NOT NULL,
    "geo_localizacao_id" INTEGER NOT NULL,
    "criador_por" INTEGER,
    "removido_por" INTEGER,
    "tipo" "GeoReferenciaTipo" NOT NULL,
    "projeto_id" INTEGER,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "meta_id" INTEGER,
    "etapa_id" INTEGER,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_em" TIMESTAMP(6),

    CONSTRAINT "geo_localicao_referencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "geo_camada_config_tipo_camada_key" ON "geo_camada_config"("tipo_camada");

-- CreateIndex
CREATE UNIQUE INDEX "geo_camada_tipo_camada_codigo_key" ON "geo_camada"("tipo_camada", "codigo");

-- AddForeignKey
ALTER TABLE "geo_camada_regiao" ADD CONSTRAINT "geo_camada_regiao_geo_camada_id_fkey" FOREIGN KEY ("geo_camada_id") REFERENCES "geo_camada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_camada_regiao" ADD CONSTRAINT "geo_camada_regiao_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regiao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_endereco_regiao" ADD CONSTRAINT "geo_endereco_regiao_geo_localizacao_id_fkey" FOREIGN KEY ("geo_localizacao_id") REFERENCES "geo_localizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_endereco_regiao" ADD CONSTRAINT "geo_endereco_regiao_geo_camada_id_fkey" FOREIGN KEY ("geo_camada_id") REFERENCES "geo_camada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_localicao_referencia" ADD CONSTRAINT "geo_localicao_referencia_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_localicao_referencia" ADD CONSTRAINT "geo_localicao_referencia_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_localicao_referencia" ADD CONSTRAINT "geo_localicao_referencia_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_localicao_referencia" ADD CONSTRAINT "geo_localicao_referencia_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_localicao_referencia" ADD CONSTRAINT "geo_localicao_referencia_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "etapa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_localicao_referencia" ADD CONSTRAINT "geo_localicao_referencia_geo_localizacao_id_fkey" FOREIGN KEY ("geo_localizacao_id") REFERENCES "geo_localizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_localicao_referencia" ADD CONSTRAINT "geo_localicao_referencia_criador_por_fkey" FOREIGN KEY ("criador_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_localicao_referencia" ADD CONSTRAINT "geo_localicao_referencia_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

update regiao  set codigo = lpad(codigo, 2,'0') where codigo is not null;
insert into geo_camada_config (tipo_camada, nivel_regionalizacao, simplificar_em, chave_camada, titulo_camada) values ('subprefeitura', 3, null, 'cd_subprefeitura', 'nm_subprefeitura');
insert into geo_camada_config (tipo_camada, nivel_regionalizacao, simplificar_em, chave_camada, titulo_camada) values ('distrito_municipal', 4, null, 'cd_distrito_municipal', 'nm_distrito_municipal');



