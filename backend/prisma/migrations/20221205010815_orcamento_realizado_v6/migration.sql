/*
  Warnings:

  - You are about to drop the column `mes_referencia` on the `orcamento_realizado` table. All the data in the column will be lost.
  - Added the required column `mes_utilizado` to the `orcamento_realizado` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dotacao" ADD COLUMN     "smae_soma_valor_empenho" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "smae_soma_valor_liquidado" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orcamento_realizado" DROP COLUMN "mes_referencia",
ADD COLUMN     "mes_utilizado" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "dotacao_processo" (
    "id" SERIAL NOT NULL,
    "informacao_valida" BOOLEAN NOT NULL,
    "sincronizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ano_referencia" INTEGER NOT NULL,
    "mes_utilizado" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "dotacao_processo" TEXT NOT NULL,
    "empenho_liquido" DOUBLE PRECISION NOT NULL,
    "valor_liquidado" DOUBLE PRECISION NOT NULL,
    "smae_soma_valor_empenho" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smae_soma_valor_liquidado" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "dotacao_processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dotacao_processo_nota" (
    "id" SERIAL NOT NULL,
    "informacao_valida" BOOLEAN NOT NULL,
    "sincronizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ano_referencia" INTEGER NOT NULL,
    "mes_utilizado" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "dotacao_processo" TEXT NOT NULL,
    "dotacao_processo_nota" TEXT NOT NULL,
    "empenho_liquido" DOUBLE PRECISION NOT NULL,
    "valor_liquidado" DOUBLE PRECISION NOT NULL,
    "pressao_orcamentaria" BOOLEAN NOT NULL,
    "smae_soma_valor_empenho" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smae_soma_valor_liquidado" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "dotacao_processo_nota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dotacao_processo_ano_referencia_dotacao_dotacao_processo_key" ON "dotacao_processo"("ano_referencia", "dotacao", "dotacao_processo");

-- CreateIndex
CREATE UNIQUE INDEX "dotacao_processo_nota_ano_referencia_dotacao_dotacao_proces_key" ON "dotacao_processo_nota"("ano_referencia", "dotacao", "dotacao_processo", "dotacao_processo_nota");
