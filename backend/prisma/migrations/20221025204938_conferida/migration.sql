/*
  Warnings:

  - You are about to drop the column `aguardando_aprovacao_cp` on the `serie_variavel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "serie_indicador" ADD COLUMN     "ha_conferencia_pendente" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "serie_variavel" DROP COLUMN "aguardando_aprovacao_cp",
ADD COLUMN     "conferida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "conferida_em" TIMESTAMP(3),
ADD COLUMN     "conferida_por" INTEGER;

-- AddForeignKey
ALTER TABLE "serie_variavel" ADD CONSTRAINT "serie_variavel_conferida_por_fkey" FOREIGN KEY ("conferida_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
