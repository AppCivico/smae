-- CreateTable
CREATE TABLE "serie_variavel_historico" (
    "id" SERIAL NOT NULL,
    "serie_variavel_id" INTEGER NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "serie" "Serie" NOT NULL,
    "data_valor" DATE NOT NULL,
    "valor_nominal" DECIMAL(65,30) NOT NULL,
    "variavel_categorica_id" INTEGER,
    "variavel_categorica_valor_id" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "conferida" BOOLEAN NOT NULL DEFAULT true,
    "conferida_por" INTEGER,
    "conferida_em" TIMESTAMP(3),
    "ciclo_fisico_id" INTEGER,

    CONSTRAINT "serie_variavel_historico_pkey" PRIMARY KEY ("id")
);
