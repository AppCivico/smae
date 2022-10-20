/*
  Warnings:

  - You are about to drop the column `indicadorId` on the `painel_conteudo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "painel_conteudo" DROP CONSTRAINT "painel_conteudo_indicadorId_fkey";

-- AlterTable
ALTER TABLE "painel_conteudo" DROP COLUMN "indicadorId",
ADD COLUMN     "indicador_id" INTEGER;

-- AddForeignKey
ALTER TABLE "painel_conteudo" ADD CONSTRAINT "painel_conteudo_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
