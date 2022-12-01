-- DropTable
DROP TABLE "dotacao";

-- CreateTable
CREATE TABLE "dotacao_planejado" (
    "id" SERIAL NOT NULL,
    "informacao_valida" BOOLEAN NOT NULL,
    "sincronizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ano_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "empenho_liquido" DOUBLE PRECISION NOT NULL,
    "valor_liquidado" DOUBLE PRECISION NOT NULL,
    "pressao_orcamentaria" BOOLEAN NOT NULL,

    CONSTRAINT "dotacao_planejado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dotacao_planejado_ano_referencia_dotacao_key" ON "dotacao_planejado"("ano_referencia", "dotacao");

alter table orcamento_planejado drop column mes_referencia;