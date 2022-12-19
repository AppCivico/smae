/*
  Warnings:

  - Made the column `sigla` on table `orgao` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "meta_orcamento_meta_id_criado_em_idx";

-- AlterTable
ALTER TABLE "meta_orcamento" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "atualizado_por" INTEGER;

-- AlterTable
ALTER TABLE "orgao" ALTER COLUMN "sigla" SET NOT NULL,
ALTER COLUMN "sigla" SET DEFAULT '-';

-- CreateIndex
CREATE INDEX "meta_orcamento_meta_id_ano_referencia_idx" ON "meta_orcamento"("meta_id", "ano_referencia");

-- AddForeignKey
ALTER TABLE "meta_orcamento" ADD CONSTRAINT "meta_orcamento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
