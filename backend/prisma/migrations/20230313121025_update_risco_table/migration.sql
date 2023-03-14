/*
  Warnings:

  - You are about to alter the column `nivel` on the `projeto_risco` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `grau` on the `projeto_risco` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "projeto_risco" ADD COLUMN     "removido_em" TIMESTAMP(3),
ADD COLUMN     "removido_por" INTEGER,
ADD COLUMN     "risco_tarefa_outros" TEXT,
ALTER COLUMN "nivel" SET DATA TYPE INTEGER,
ALTER COLUMN "grau" SET DATA TYPE INTEGER;

-- DropEnum
DROP TYPE "ProjetoRiscoStatus";
