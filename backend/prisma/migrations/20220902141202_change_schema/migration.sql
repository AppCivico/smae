/*
  Warnings:

  - You are about to drop the `pmd_arquivo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pmd_arquivo" DROP CONSTRAINT "pmd_arquivo_arquivo_id_fkey";

-- DropForeignKey
ALTER TABLE "pmd_arquivo" DROP CONSTRAINT "pmd_arquivo_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "pmd_arquivo" DROP CONSTRAINT "pmd_arquivo_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "pmd_arquivo" DROP CONSTRAINT "pmd_arquivo_pdm_id_fkey";

-- DropForeignKey
ALTER TABLE "pmd_arquivo" DROP CONSTRAINT "pmd_arquivo_removido_por_fkey";

-- DropTable
DROP TABLE "pmd_arquivo";

-- CreateTable
CREATE TABLE "arquivo_documento" (
    "id" SERIAL NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "pdm_id" INTEGER,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "arquivo_documento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "arquivo_documento" ADD CONSTRAINT "arquivo_documento_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo_documento" ADD CONSTRAINT "arquivo_documento_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo_documento" ADD CONSTRAINT "arquivo_documento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo_documento" ADD CONSTRAINT "arquivo_documento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo_documento" ADD CONSTRAINT "arquivo_documento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
