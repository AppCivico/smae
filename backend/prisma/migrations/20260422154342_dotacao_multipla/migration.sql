/*
  Warnings:

  - You are about to drop the column `dotacao` on the `distribuicao_recurso` table. All the data in the column will be lost.
  - You are about to drop the column `dotacao` on the `transferencia` table. All the data in the column will be lost.

*/

-- CreateTable (before data migration so we can insert existing values)
CREATE TABLE "distribuicao_recurso_dotacao" (
    "id" SERIAL NOT NULL,
    "distribuicao_recurso_id" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,

    CONSTRAINT "distribuicao_recurso_dotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencia_dotacao" (
    "id" SERIAL NOT NULL,
    "transferencia_id" INTEGER NOT NULL,
    "dotacao" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,

    CONSTRAINT "transferencia_dotacao_pkey" PRIMARY KEY ("id")
);

-- Migrate existing single dotacao values from distribuicao_recurso
INSERT INTO "distribuicao_recurso_dotacao" ("distribuicao_recurso_id", "dotacao", "criado_em", "criado_por", "atualizado_em", "atualizado_por")
SELECT id, btrim(dotacao), criado_em, criado_por, COALESCE(atualizado_em, criado_em), atualizado_por
FROM "distribuicao_recurso"
WHERE dotacao IS NOT NULL AND length(btrim(dotacao)) > 0;

-- Migrate existing single dotacao values from transferencia
INSERT INTO "transferencia_dotacao" ("transferencia_id", "dotacao", "criado_em", "criado_por", "atualizado_em", "atualizado_por")
SELECT id, btrim(dotacao), criado_em, criado_por, COALESCE(atualizado_em, criado_em), atualizado_por
FROM "transferencia"
WHERE dotacao IS NOT NULL AND length(btrim(dotacao)) > 0;

-- AlterTable
ALTER TABLE "distribuicao_recurso" DROP COLUMN "dotacao";

-- AlterTable
ALTER TABLE "transferencia" DROP COLUMN "dotacao";

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_dotacao" ADD CONSTRAINT "distribuicao_recurso_dotacao_distribuicao_recurso_id_fkey" FOREIGN KEY ("distribuicao_recurso_id") REFERENCES "distribuicao_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_dotacao" ADD CONSTRAINT "distribuicao_recurso_dotacao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_dotacao" ADD CONSTRAINT "distribuicao_recurso_dotacao_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_dotacao" ADD CONSTRAINT "distribuicao_recurso_dotacao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_dotacao" ADD CONSTRAINT "transferencia_dotacao_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "transferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_dotacao" ADD CONSTRAINT "transferencia_dotacao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_dotacao" ADD CONSTRAINT "transferencia_dotacao_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_dotacao" ADD CONSTRAINT "transferencia_dotacao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex (parent FK lookup)
CREATE INDEX "distribuicao_recurso_dotacao_distribuicao_recurso_id_idx" ON "distribuicao_recurso_dotacao"("distribuicao_recurso_id");

-- CreateIndex (parent FK lookup)
CREATE INDEX "transferencia_dotacao_transferencia_id_idx" ON "transferencia_dotacao"("transferencia_id");

-- CreateIndex (partial unique: enforce uniqueness for active rows)
CREATE UNIQUE INDEX "distribuicao_recurso_dotacao_active_uniq" ON "distribuicao_recurso_dotacao"("distribuicao_recurso_id", "dotacao") WHERE "removido_em" IS NULL;

-- CreateIndex (partial unique: enforce uniqueness for active rows)
CREATE UNIQUE INDEX "transferencia_dotacao_active_uniq" ON "transferencia_dotacao"("transferencia_id", "dotacao") WHERE "removido_em" IS NULL;
