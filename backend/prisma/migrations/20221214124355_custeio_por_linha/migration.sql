/*
  Warnings:

  - You are about to drop the column `soma_custeio_previsto` on the `meta_orcamento` table. All the data in the column will be lost.
  - You are about to drop the column `soma_investimento_previsto` on the `meta_orcamento` table. All the data in the column will be lost.
  - You are about to drop the column `ultima_revisao` on the `meta_orcamento` table. All the data in the column will be lost.
  - You are about to drop the `meta_orcamento_item` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `custeio_previsto` to the `meta_orcamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `investimento_previsto` to the `meta_orcamento` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "meta_orcamento_item" DROP CONSTRAINT "meta_orcamento_item_meta_orcamento_id_fkey";

-- DropIndex
DROP INDEX "meta_orcamento_criado_em_idx";

-- DropIndex
DROP INDEX "meta_orcamento_meta_id_ultima_revisao_idx";

delete from meta_orcamento;

-- AlterTable
ALTER TABLE "meta_orcamento" DROP COLUMN "soma_custeio_previsto",
DROP COLUMN "soma_investimento_previsto",
DROP COLUMN "ultima_revisao",
ADD COLUMN     "atividade_id" INTEGER,
ADD COLUMN     "custeio_previsto" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "iniciativa_id" INTEGER,
ADD COLUMN     "investimento_previsto" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "parte_dotacao" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "meta_orcamento_item";

-- CreateIndex
CREATE INDEX "meta_orcamento_meta_id_criado_em_idx" ON "meta_orcamento"("meta_id", "criado_em");

-- AddForeignKey
ALTER TABLE "meta_orcamento" ADD CONSTRAINT "meta_orcamento_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_orcamento" ADD CONSTRAINT "meta_orcamento_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
