-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjetoStatus" ADD VALUE 'MDO_NaoIniciada';
ALTER TYPE "ProjetoStatus" ADD VALUE 'MDO_EmAndamento';
ALTER TYPE "ProjetoStatus" ADD VALUE 'MDO_Concluida';
ALTER TYPE "ProjetoStatus" ADD VALUE 'MDO_Paralisada';

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "equipamento_id" INTEGER,
ADD COLUMN     "grupo_tematico_id" INTEGER,
ADD COLUMN     "mdo_detalhamento" TEXT,
ADD COLUMN     "mdo_n_familias_beneficiadas" INTEGER,
ADD COLUMN     "mdo_n_unidades_habitacionais" INTEGER,
ADD COLUMN     "mdo_observacoes" TEXT,
ADD COLUMN     "mdo_previsao_inauguracao" DATE,
ADD COLUMN     "mdo_programa_habitacional" TEXT,
ADD COLUMN     "orgao_executor_id" INTEGER,
ADD COLUMN     "orgao_origem_id" INTEGER,
ADD COLUMN     "tipo_intervencao_id" INTEGER;

-- CreateTable
CREATE TABLE "projeto_regiao" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "regiao_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMP(3),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMP(3),

    CONSTRAINT "projeto_regiao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projeto_regiao_projeto_id_idx" ON "projeto_regiao"("projeto_id");

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_grupo_tematico_id_fkey" FOREIGN KEY ("grupo_tematico_id") REFERENCES "grupo_tematico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_tipo_intervencao_id_fkey" FOREIGN KEY ("tipo_intervencao_id") REFERENCES "tipo_intervencao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_orgao_executor_id_fkey" FOREIGN KEY ("orgao_executor_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_orgao_origem_id_fkey" FOREIGN KEY ("orgao_origem_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_regiao" ADD CONSTRAINT "projeto_regiao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_regiao" ADD CONSTRAINT "projeto_regiao_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regiao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_regiao" ADD CONSTRAINT "projeto_regiao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_regiao" ADD CONSTRAINT "projeto_regiao_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_regiao" ADD CONSTRAINT "projeto_regiao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
