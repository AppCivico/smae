-- DropForeignKey
ALTER TABLE "meta_orcamento" DROP CONSTRAINT "meta_orcamento_meta_id_fkey";

-- DropForeignKey
ALTER TABLE "orcamento_planejado" DROP CONSTRAINT "orcamento_planejado_meta_id_fkey";

-- AlterTable
ALTER TABLE "dotacao_planejado" ADD COLUMN     "pp_pressao_orcamentaria" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pp_soma_valor_planejado" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "dotacao_processo" ADD COLUMN     "pp_soma_valor_empenho" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pp_soma_valor_liquidado" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "dotacao_processo_nota" ADD COLUMN     "pp_soma_valor_empenho" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pp_soma_valor_liquidado" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "dotacao_realizado" ADD COLUMN     "pp_soma_valor_empenho" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pp_soma_valor_liquidado" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "meta_orcamento" ADD COLUMN     "projeto_id" INTEGER,
ALTER COLUMN "meta_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orcamento_planejado" ADD COLUMN     "projeto_id" INTEGER,
ALTER COLUMN "meta_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "meta_orcamento" ADD CONSTRAINT "meta_orcamento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_orcamento" ADD CONSTRAINT "meta_orcamento_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_planejado" ADD CONSTRAINT "orcamento_planejado_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_planejado" ADD CONSTRAINT "orcamento_planejado_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
