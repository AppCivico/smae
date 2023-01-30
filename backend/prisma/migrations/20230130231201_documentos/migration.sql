/*
  Warnings:

  - You are about to drop the column `documento_id` on the `projeto_documento` table. All the data in the column will be lost.
  - Added the required column `arquivo_id` to the `projeto_documento` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "projeto_documento" DROP CONSTRAINT "projeto_documento_documento_id_fkey";

-- AlterTable
ALTER TABLE "projeto_documento" DROP COLUMN "documento_id",
ADD COLUMN     "arquivo_id" INTEGER NOT NULL,
ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "atualizado_por" INTEGER,
ADD COLUMN     "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criado_por" INTEGER,
ADD COLUMN     "removido_em" TIMESTAMPTZ(6),
ADD COLUMN     "removido_por" INTEGER;

-- AddForeignKey
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
