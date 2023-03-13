/*
  Warnings:

  - You are about to drop the column `medidas_contrapartida` on the `plano_acao` table. All the data in the column will be lost.
  - You are about to drop the column `risco_id` on the `plano_acao` table. All the data in the column will be lost.
  - You are about to drop the column `numero` on the `projeto_risco` table. All the data in the column will be lost.
  - You are about to alter the column `probabilidade` on the `projeto_risco` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `impacto` on the `projeto_risco` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `criado_em` to the `plano_acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `criado_por` to the `plano_acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medidas_de_contingencia` to the `plano_acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projeto_risco_id` to the `plano_acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `criado_por` to the `projeto_risco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrado_em` to the `projeto_risco` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "plano_acao" DROP CONSTRAINT "plano_acao_risco_id_fkey";

-- DropIndex
DROP INDEX "plano_acao_risco_id_idx";

-- AlterTable
ALTER TABLE "plano_acao" DROP COLUMN "medidas_contrapartida",
DROP COLUMN "risco_id",
ADD COLUMN     "atualizado_em" TIMESTAMP(3),
ADD COLUMN     "atualizado_por" INTEGER,
ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "criado_por" INTEGER NOT NULL,
ADD COLUMN     "medidas_de_contingencia" TEXT NOT NULL,
ADD COLUMN     "projeto_risco_id" INTEGER NOT NULL,
ADD COLUMN     "removido_em" TIMESTAMP(3),
ADD COLUMN     "removido_por" INTEGER,
ALTER COLUMN "prazo_contramedida" DROP NOT NULL,
ALTER COLUMN "custo" DROP NOT NULL,
ALTER COLUMN "custo_percentual" DROP NOT NULL;

-- AlterTable
ALTER TABLE "projeto_risco" DROP COLUMN "numero",
ADD COLUMN     "atualizado_em" TIMESTAMP(3),
ADD COLUMN     "atualizado_por" INTEGER,
ADD COLUMN     "criado_por" INTEGER NOT NULL,
ADD COLUMN     "registrado_em" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "probabilidade" SET DATA TYPE INTEGER,
ALTER COLUMN "impacto" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE INDEX "plano_acao_projeto_risco_id_idx" ON "plano_acao"("projeto_risco_id");

-- AddForeignKey
ALTER TABLE "projeto_risco" ADD CONSTRAINT "projeto_risco_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_risco" ADD CONSTRAINT "projeto_risco_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_risco" ADD CONSTRAINT "projeto_risco_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_acao" ADD CONSTRAINT "plano_acao_projeto_risco_id_fkey" FOREIGN KEY ("projeto_risco_id") REFERENCES "projeto_risco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_acao" ADD CONSTRAINT "plano_acao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_acao" ADD CONSTRAINT "plano_acao_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_acao" ADD CONSTRAINT "plano_acao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
