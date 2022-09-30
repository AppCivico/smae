/*
  Warnings:

  - You are about to drop the column `rotulo` on the `atividade` table. All the data in the column will be lost.
  - You are about to drop the column `rotulo` on the `iniciativa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "atividade" DROP COLUMN "rotulo";

-- AlterTable
ALTER TABLE "iniciativa" DROP COLUMN "rotulo";

-- AlterTable
ALTER TABLE "pdm" ADD COLUMN     "possui_atividade" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "possui_iniciativa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rotulo_atividade" TEXT NOT NULL DEFAULT 'Atividade',
ADD COLUMN     "rotulo_iniciativa" TEXT NOT NULL DEFAULT 'Iniciativa';
