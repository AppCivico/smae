/*
  Warnings:

  - You are about to drop the column `liquidacao_pagamento` on the `distribuicao_recurso` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "distribuicao_recurso" DROP COLUMN "liquidacao_pagamento",
ADD COLUMN     "gestor_contrato" TEXT,
ADD COLUMN     "valor_liquidado" DECIMAL(15,2) NOT NULL DEFAULT 0,
ALTER COLUMN "valor_empenho" DROP NOT NULL;
