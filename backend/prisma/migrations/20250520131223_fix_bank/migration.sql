/*
  Warnings:

  - You are about to drop the column `agencia_aceite` on the `distribuicao_recurso` table. All the data in the column will be lost.
  - You are about to drop the column `agencia_fim` on the `distribuicao_recurso` table. All the data in the column will be lost.
  - You are about to drop the column `banco_aceite` on the `distribuicao_recurso` table. All the data in the column will be lost.
  - You are about to drop the column `banco_fim` on the `distribuicao_recurso` table. All the data in the column will be lost.
  - You are about to drop the column `conta_aceite` on the `distribuicao_recurso` table. All the data in the column will be lost.
  - You are about to drop the column `conta_fim` on the `distribuicao_recurso` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "distribuicao_recurso" DROP COLUMN "agencia_aceite",
DROP COLUMN "agencia_fim",
DROP COLUMN "banco_aceite",
DROP COLUMN "banco_fim",
DROP COLUMN "conta_aceite",
DROP COLUMN "conta_fim",
ADD COLUMN     "distribuicao_agencia" TEXT,
ADD COLUMN     "distribuicao_banco" TEXT,
ADD COLUMN     "distribuicao_conta" TEXT;
