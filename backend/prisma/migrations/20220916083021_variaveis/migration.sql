-- CreateEnum
CREATE TYPE "Serie" AS ENUM ('Previsto', 'Realizado', 'PrevistoAcumulado', 'RealizadoAcumulado');

-- CreateTable
CREATE TABLE "unidade_medida" (
    "id" SERIAL NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "unidade_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variavel" (
    "id" SERIAL NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "regiao_id" INTEGER,
    "titulo" TEXT NOT NULL,
    "valor_base" DECIMAL(65,30) NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL,
    "unidade_medida_id" INTEGER NOT NULL,
    "peso" INTEGER,
    "acumulativa" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "variavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicador_variavel" (
    "id" SERIAL NOT NULL,
    "indicador_id" INTEGER NOT NULL,
    "desativado" BOOLEAN NOT NULL DEFAULT false,
    "desativado_em" TIMESTAMP(3),
    "desativado_por" INTEGER,

    CONSTRAINT "indicador_variavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serie_indicador" (
    "id" SERIAL NOT NULL,
    "indicador_id" INTEGER NOT NULL,
    "regiao_id" INTEGER,
    "serie" "Serie" NOT NULL,
    "data_valor" DATE NOT NULL,
    "valor_nominal" DECIMAL(65,30) NOT NULL,
    "valor_percentual" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "serie_indicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serie_variavel" (
    "id" SERIAL NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "serie" "Serie" NOT NULL,
    "data_valor" DATE NOT NULL,
    "valor_nominal" DECIMAL(65,30) NOT NULL,
    "valor_percentual" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "serie_variavel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "unidade_medida" ADD CONSTRAINT "unidade_medida_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidade_medida" ADD CONSTRAINT "unidade_medida_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidade_medida" ADD CONSTRAINT "unidade_medida_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_unidade_medida_id_fkey" FOREIGN KEY ("unidade_medida_id") REFERENCES "unidade_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_variavel" ADD CONSTRAINT "indicador_variavel_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_variavel" ADD CONSTRAINT "indicador_variavel_desativado_por_fkey" FOREIGN KEY ("desativado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serie_indicador" ADD CONSTRAINT "serie_indicador_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serie_indicador" ADD CONSTRAINT "serie_indicador_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serie_variavel" ADD CONSTRAINT "serie_variavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
