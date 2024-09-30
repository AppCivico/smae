/*
  Warnings:

  - Made the column `tipoTransferencia` on table `classificacao` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "classificacao" DROP CONSTRAINT "classificacao_tipoTransferencia_fkey";

-- AlterTable
ALTER TABLE "classificacao" ALTER COLUMN "tipoTransferencia" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "classificacao" ADD CONSTRAINT "classificacao_tipoTransferencia_fkey" FOREIGN KEY ("tipoTransferencia") REFERENCES "transferencia_tipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
