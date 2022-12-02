
-- DropTable
DROP TABLE "dotacao_planejado";

-- CreateTable
CREATE TABLE "dotacao" (
    "id" SERIAL NOT NULL,
    "informacao_valida" BOOLEAN NOT NULL,
    "sincronizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ano_referencia" INTEGER NOT NULL,
    "mes_utilizado" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "empenho_liquido" DOUBLE PRECISION NOT NULL,
    "valor_liquidado" DOUBLE PRECISION NOT NULL,
    "pressao_orcamentaria" BOOLEAN NOT NULL,

    CONSTRAINT "dotacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dotacao_ano_referencia_dotacao_key" ON "dotacao"("ano_referencia", "dotacao");
