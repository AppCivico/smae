-- CreateEnum
CREATE TYPE "NivelOrcamento" AS ENUM ('Meta', 'Iniciativa', 'Atividade');

-- AlterTable
ALTER TABLE "pdm" ADD COLUMN     "nivel_orcamento" "NivelOrcamento" NOT NULL DEFAULT 'Meta';

-- CreateTable
CREATE TABLE "meta_orcamento_config" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "previsao_custo_disponivel" BOOLEAN NOT NULL DEFAULT true,
    "planejado_disponivel" BOOLEAN NOT NULL DEFAULT false,
    "execucao_disponivel" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "meta_orcamento_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_orcamento" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,
    "custeio_previsto" DOUBLE PRECISION NOT NULL,
    "investimento_previsto" DOUBLE PRECISION NOT NULL,
    "parte_dotacao" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "meta_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento_planejado" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "ano_referencia" INTEGER NOT NULL,
    "valor_planejado" DOUBLE PRECISION NOT NULL,
    "dotacao" TEXT NOT NULL,
    "valor_dotacao" DOUBLE PRECISION,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,
    check (CASE WHEN atividade_id is not null THEN iniciativa_id is not null ELSE true END),

    CONSTRAINT "orcamento_planejado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento_realizado" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "processo" TEXT,
    "nota_empenho" TEXT,
    "valor_empenhado" DOUBLE PRECISION NOT NULL,
    "valor_liquidado" DOUBLE PRECISION NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    check (CASE WHEN atividade_id is not null THEN iniciativa_id is not null ELSE true END),

    CONSTRAINT "orcamento_realizado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meta_orcamento_config_pdm_id_idx" ON "meta_orcamento_config"("pdm_id");

-- CreateIndex
CREATE INDEX "meta_orcamento_meta_id_idx" ON "meta_orcamento"("meta_id");

-- CreateIndex
CREATE INDEX "orcamento_planejado_meta_id_idx" ON "orcamento_planejado"("meta_id");

-- CreateIndex
CREATE INDEX "orcamento_realizado_meta_id_idx" ON "orcamento_realizado"("meta_id");

-- AddForeignKey
ALTER TABLE "meta_orcamento_config" ADD CONSTRAINT "meta_orcamento_config_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_orcamento" ADD CONSTRAINT "meta_orcamento_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_planejado" ADD CONSTRAINT "orcamento_planejado_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_planejado" ADD CONSTRAINT "orcamento_planejado_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_planejado" ADD CONSTRAINT "orcamento_planejado_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_realizado" ADD CONSTRAINT "orcamento_realizado_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_realizado" ADD CONSTRAINT "orcamento_realizado_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_realizado" ADD CONSTRAINT "orcamento_realizado_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
