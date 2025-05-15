-- AlterTable
ALTER TABLE "distribuicao_recurso" ADD COLUMN     "finalidade" TEXT,
ADD COLUMN     "liquidacao_pagamento" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rubrica_de_receita" TEXT,
ADD COLUMN     "valor_empenho" DECIMAL(15,2) NOT NULL DEFAULT 0;
