delete from orcamento_planejado;
delete from orcamento_realizado;

-- AlterTable
ALTER TABLE "orcamento_planejado" DROP COLUMN "valor_dotacao",
ADD COLUMN     "mes_referencia" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "orcamento_realizado" DROP COLUMN "ano",
DROP COLUMN "mes",
ADD COLUMN     "ano_referencia" INTEGER NOT NULL,
ADD COLUMN     "mes_referencia" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "dotacao" (
    "id" SERIAL NOT NULL,
    "informacao_valida" BOOLEAN NOT NULL,
    "sincronizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ano_referencia" INTEGER NOT NULL,
    "mes_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "empenho_liquido" DOUBLE PRECISION NOT NULL,
    "valor_liquidado" DOUBLE PRECISION NOT NULL,
    "pressao_orcamentaria" BOOLEAN NOT NULL,

    CONSTRAINT "dotacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dotacao_ano_referencia_mes_referencia_dotacao_key" ON "dotacao"("ano_referencia", "mes_referencia", "dotacao");
