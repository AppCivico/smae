/*
  Warnings:

  - You are about to alter the column `valor_absoluto_bkp` on the `contrato_aditivo` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'refresh_meta_orcamento_consolidado';

-- AlterTable
ALTER TABLE "contrato_aditivo" ALTER COLUMN "valor_absoluto_bkp" SET DATA TYPE DECIMAL(65,30);
