DROP VIEW if exists view_meta_orcamento_realizado;
DROP VIEW if exists view_meta_orcamento_plan;

/*
  Warnings:

  - You are about to drop the column `pp_pressao_orcamentaria` on the `dotacao_planejado` table. All the data in the column will be lost.
  - You are about to drop the column `pp_soma_valor_planejado` on the `dotacao_planejado` table. All the data in the column will be lost.
  - You are about to drop the column `pressao_orcamentaria` on the `dotacao_planejado` table. All the data in the column will be lost.
  - You are about to drop the column `smae_soma_valor_planejado` on the `dotacao_planejado` table. All the data in the column will be lost.
  - You are about to alter the column `saldo_disponivel` on the `dotacao_planejado` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `val_orcado_atualizado` on the `dotacao_planejado` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `val_orcado_inicial` on the `dotacao_planejado` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to drop the column `pp_soma_valor_empenho` on the `dotacao_processo` table. All the data in the column will be lost.
  - You are about to drop the column `pp_soma_valor_liquidado` on the `dotacao_processo` table. All the data in the column will be lost.
  - You are about to drop the column `smae_soma_valor_empenho` on the `dotacao_processo` table. All the data in the column will be lost.
  - You are about to drop the column `smae_soma_valor_liquidado` on the `dotacao_processo` table. All the data in the column will be lost.
  - You are about to alter the column `empenho_liquido` on the `dotacao_processo` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `valor_liquidado` on the `dotacao_processo` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to drop the column `pp_soma_valor_empenho` on the `dotacao_processo_nota` table. All the data in the column will be lost.
  - You are about to drop the column `pp_soma_valor_liquidado` on the `dotacao_processo_nota` table. All the data in the column will be lost.
  - You are about to drop the column `smae_soma_valor_empenho` on the `dotacao_processo_nota` table. All the data in the column will be lost.
  - You are about to drop the column `smae_soma_valor_liquidado` on the `dotacao_processo_nota` table. All the data in the column will be lost.
  - You are about to alter the column `empenho_liquido` on the `dotacao_processo_nota` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `valor_liquidado` on the `dotacao_processo_nota` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to drop the column `pp_soma_valor_empenho` on the `dotacao_realizado` table. All the data in the column will be lost.
  - You are about to drop the column `pp_soma_valor_liquidado` on the `dotacao_realizado` table. All the data in the column will be lost.
  - You are about to drop the column `smae_soma_valor_empenho` on the `dotacao_realizado` table. All the data in the column will be lost.
  - You are about to drop the column `smae_soma_valor_liquidado` on the `dotacao_realizado` table. All the data in the column will be lost.
  - You are about to alter the column `empenho_liquido` on the `dotacao_realizado` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `valor_liquidado` on the `dotacao_realizado` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `valor_planejado` on the `orcamento_planejado` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `soma_valor_empenho` on the `orcamento_realizado` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `soma_valor_liquidado` on the `orcamento_realizado` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `valor_empenho` on the `orcamento_realizado_item` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `valor_liquidado` on the `orcamento_realizado_item` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.

*/
-- DropForeignKey
ALTER TABLE "orcamento_realizado" DROP CONSTRAINT "orcamento_realizado_meta_id_fkey";

-- DropIndex
DROP INDEX "orcamento_realizado_ano_referencia_atividade_id_idx";

-- DropIndex
DROP INDEX "orcamento_realizado_ano_referencia_iniciativa_id_idx";

-- AlterTable
ALTER TABLE "dotacao_planejado" DROP COLUMN "pp_pressao_orcamentaria",
DROP COLUMN "pp_soma_valor_planejado",
DROP COLUMN "pressao_orcamentaria",
DROP COLUMN "smae_soma_valor_planejado",
ALTER COLUMN "saldo_disponivel" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "val_orcado_atualizado" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "val_orcado_inicial" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "dotacao_processo" DROP COLUMN "pp_soma_valor_empenho",
DROP COLUMN "pp_soma_valor_liquidado",
DROP COLUMN "smae_soma_valor_empenho",
DROP COLUMN "smae_soma_valor_liquidado",
ALTER COLUMN "empenho_liquido" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "valor_liquidado" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "dotacao_processo_nota" DROP COLUMN "pp_soma_valor_empenho",
DROP COLUMN "pp_soma_valor_liquidado",
DROP COLUMN "smae_soma_valor_empenho",
DROP COLUMN "smae_soma_valor_liquidado",
ALTER COLUMN "empenho_liquido" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "valor_liquidado" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "dotacao_realizado" DROP COLUMN "pp_soma_valor_empenho",
DROP COLUMN "pp_soma_valor_liquidado",
DROP COLUMN "smae_soma_valor_empenho",
DROP COLUMN "smae_soma_valor_liquidado",
ALTER COLUMN "empenho_liquido" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "valor_liquidado" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "orcamento_planejado" ALTER COLUMN "valor_planejado" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "orcamento_realizado" ADD COLUMN     "projeto_id" INTEGER,
ALTER COLUMN "meta_id" DROP NOT NULL,
ALTER COLUMN "soma_valor_empenho" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "soma_valor_liquidado" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "orcamento_realizado_item" ALTER COLUMN "valor_empenho" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "valor_liquidado" SET DATA TYPE DECIMAL(15,2);

-- CreateTable
CREATE TABLE "pdm_dotacao_planejado" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "pressao_orcamentaria" BOOLEAN NOT NULL,
    "soma_valor_planejado" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "pdm_dotacao_planejado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_dotacao_planejado" (
    "id" SERIAL NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "pressao_orcamentaria" BOOLEAN NOT NULL,
    "soma_valor_planejado" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "portfolio_dotacao_planejado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdm_dotacao_realizado" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "soma_valor_empenho" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "soma_valor_liquidado" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "pdm_dotacao_realizado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_dotacao_realizado" (
    "id" SERIAL NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "soma_valor_empenho" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "soma_valor_liquidado" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "portfolio_dotacao_realizado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdm_dotacao_processo" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "dotacao_processo" TEXT NOT NULL,
    "soma_valor_empenho" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "soma_valor_liquidado" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "pdm_dotacao_processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_dotacao_processo" (
    "id" SERIAL NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "dotacao_processo" TEXT NOT NULL,
    "soma_valor_empenho" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "soma_valor_liquidado" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "portfolio_dotacao_processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdm_dotacao_processo_nota" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "dotacao_processo" TEXT NOT NULL,
    "dotacao_processo_nota" TEXT NOT NULL,
    "soma_valor_empenho" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "soma_valor_liquidado" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "pdm_dotacao_processo_nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_dotacao_processo_nota" (
    "id" SERIAL NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "dotacao_processo" TEXT NOT NULL,
    "dotacao_processo_nota" TEXT NOT NULL,
    "soma_valor_empenho" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "soma_valor_liquidado" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "portfolio_dotacao_processo_nota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pdm_dotacao_planejado_pdm_id_ano_referencia_dotacao_key" ON "pdm_dotacao_planejado"("pdm_id", "ano_referencia", "dotacao");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_dotacao_planejado_portfolio_id_ano_referencia_dot_key" ON "portfolio_dotacao_planejado"("portfolio_id", "ano_referencia", "dotacao");

-- CreateIndex
CREATE UNIQUE INDEX "pdm_dotacao_realizado_pdm_id_ano_referencia_dotacao_key" ON "pdm_dotacao_realizado"("pdm_id", "ano_referencia", "dotacao");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_dotacao_realizado_portfolio_id_ano_referencia_dot_key" ON "portfolio_dotacao_realizado"("portfolio_id", "ano_referencia", "dotacao");

-- CreateIndex
CREATE UNIQUE INDEX "pdm_dotacao_processo_pdm_id_ano_referencia_dotacao_dotacao__key" ON "pdm_dotacao_processo"("pdm_id", "ano_referencia", "dotacao", "dotacao_processo");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_dotacao_processo_portfolio_id_ano_referencia_dota_key" ON "portfolio_dotacao_processo"("portfolio_id", "ano_referencia", "dotacao", "dotacao_processo");

-- CreateIndex
CREATE UNIQUE INDEX "pdm_dotacao_processo_nota_pdm_id_ano_referencia_dotacao_dot_key" ON "pdm_dotacao_processo_nota"("pdm_id", "ano_referencia", "dotacao", "dotacao_processo", "dotacao_processo_nota");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_dotacao_processo_nota_portfolio_id_ano_referencia_key" ON "portfolio_dotacao_processo_nota"("portfolio_id", "ano_referencia", "dotacao", "dotacao_processo", "dotacao_processo_nota");

-- CreateIndex
CREATE INDEX "orcamento_planejado_projeto_id_idx" ON "orcamento_planejado"("projeto_id");

-- CreateIndex
CREATE INDEX "orcamento_realizado_projeto_id_idx" ON "orcamento_realizado"("projeto_id");

-- CreateIndex
CREATE INDEX "orcamento_realizado_ano_referencia_projeto_id_idx" ON "orcamento_realizado"("ano_referencia", "projeto_id");

-- CreateIndex
CREATE INDEX "orcamento_realizado_item_orcamento_realizado_id_idx" ON "orcamento_realizado_item"("orcamento_realizado_id");

-- AddForeignKey
ALTER TABLE "pdm_dotacao_planejado" ADD CONSTRAINT "pdm_dotacao_planejado_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_dotacao_planejado" ADD CONSTRAINT "portfolio_dotacao_planejado_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_dotacao_realizado" ADD CONSTRAINT "pdm_dotacao_realizado_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_dotacao_realizado" ADD CONSTRAINT "portfolio_dotacao_realizado_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_dotacao_processo" ADD CONSTRAINT "pdm_dotacao_processo_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_dotacao_processo" ADD CONSTRAINT "portfolio_dotacao_processo_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_dotacao_processo_nota" ADD CONSTRAINT "pdm_dotacao_processo_nota_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_dotacao_processo_nota" ADD CONSTRAINT "portfolio_dotacao_processo_nota_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_realizado" ADD CONSTRAINT "orcamento_realizado_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_realizado" ADD CONSTRAINT "orcamento_realizado_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION f_tgr_update_soma_dotacao()
    RETURNS TRIGGER
    AS $$
DECLARE
 tmp INTEGER;
BEGIN
    -- Pdm dotacao_planejado
    WITH pdm_sum AS(
        SELECT
            m.pdm_id,
            SUM(op.valor_planejado) AS valor_planejado_sum
        FROM orcamento_planejado op
        JOIN meta m ON m.id = op.meta_id
        WHERE op.removido_em IS NULL
        AND m.removido_em IS NULL
        AND op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        GROUP BY 1
    ),
    pdm_upsert AS(
    INSERT INTO pdm_dotacao_planejado(pdm_id, ano_referencia, dotacao, pressao_orcamentaria, soma_valor_planejado)
        SELECT
            pdm_sum.pdm_id,
            NEW.ano_referencia,
            NEW.dotacao,
            pdm_sum.valor_planejado_sum > NEW.val_orcado_atualizado,
            pdm_sum.valor_planejado_sum
        FROM
            pdm_sum
        ON CONFLICT(pdm_id,
            ano_referencia,
            dotacao)
            DO UPDATE SET
                pressao_orcamentaria = EXCLUDED.pressao_orcamentaria,
                soma_valor_planejado = EXCLUDED.soma_valor_planejado
    ) SELECT 1 into tmp;

    -- Portfoliodotacao_planejado calculations
    WITH portfolio_sum AS(
        SELECT
            p.portfolio_id,
            SUM(op.valor_planejado) AS valor_planejado_sum
        FROM orcamento_planejado op
        JOIN projeto p ON op.projeto_id = p.id
        WHERE op.removido_em IS NULL
        AND p.removido_em IS NULL
        AND op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        GROUP BY 1
    ),
    portfolio_upsert AS(
    INSERT INTO portfolio_dotacao_planejado(portfolio_id, ano_referencia, dotacao, pressao_orcamentaria, soma_valor_planejado)
        SELECT
            portfolio_sum.portfolio_id,
            NEW.ano_referencia,
            NEW.dotacao,
            portfolio_sum.valor_planejado_sum > NEW.val_orcado_atualizado,
            portfolio_sum.valor_planejado_sum
        FROM
            portfolio_sum
        ON CONFLICT(portfolio_id, ano_referencia, dotacao)
            DO UPDATE SET
                pressao_orcamentaria = EXCLUDED.pressao_orcamentaria,
                soma_valor_planejado = EXCLUDED.soma_valor_planejado
    ) SELECT 1 into tmp;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER tgr_dotacao_change
AFTER INSERT OR UPDATE
ON dotacao_planejado
FOR EACH ROW
EXECUTE FUNCTION f_tgr_update_soma_dotacao();

CREATE OR REPLACE FUNCTION f_tgr_delete_dotacao()
RETURNS TRIGGER
AS $$
BEGIN
  RAISE EXCEPTION 'Não é possível executar DELETE no DotacaoPlanejado, para fazer isso, deslige as triggers e lembre-se de limpar as tabelas dependentes corretamente.';
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER tgr_dotacao_delete
BEFORE DELETE
ON dotacao_planejado
FOR EACH ROW
EXECUTE FUNCTION f_tgr_delete_dotacao();



