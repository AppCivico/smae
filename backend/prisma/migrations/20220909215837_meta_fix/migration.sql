/*
  Warnings:

  - You are about to drop the column `desativado_em` on the `meta` table. All the data in the column will be lost.
  - You are about to drop the column `desativado_por` on the `meta` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "meta" DROP CONSTRAINT "meta_desativado_por_fkey";

-- AlterTable
ALTER TABLE "meta" DROP COLUMN "desativado_em",
DROP COLUMN "desativado_por",
ADD COLUMN     "removido_em" TIMESTAMPTZ(6),
ADD COLUMN     "removido_por" INTEGER;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
