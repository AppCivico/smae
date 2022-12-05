-- DropTable
ALTER TABLE "dotacao" RENAME TO dotacao_planejado;

alter table dotacao_planejado drop column smae_soma_valor_empenho;
alter table dotacao_planejado drop column smae_soma_valor_liquidado;

-- AlterTable
ALTER TABLE "dotacao_planejado" RENAME CONSTRAINT "dotacao_pkey" TO "dotacao_planejado_pkey";

-- RenameIndex
ALTER INDEX "dotacao_ano_referencia_dotacao_key" RENAME TO "dotacao_planejado_ano_referencia_dotacao_key";


-- CreateTable
CREATE TABLE "dotacao_realizado" (
    "id" SERIAL NOT NULL,
    "informacao_valida" BOOLEAN NOT NULL,
    "sincronizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ano_referencia" INTEGER NOT NULL,
    "mes_utilizado" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "empenho_liquido" DOUBLE PRECISION NOT NULL,
    "valor_liquidado" DOUBLE PRECISION NOT NULL,
    "smae_soma_valor_empenho" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smae_soma_valor_liquidado" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "dotacao_realizado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dotacao_realizado_ano_referencia_dotacao_key" ON "dotacao_realizado"("ano_referencia", "dotacao");
