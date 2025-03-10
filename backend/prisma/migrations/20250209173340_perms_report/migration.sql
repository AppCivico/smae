/*
  Warnings:

  - You are about to drop the column `eh_publico` on the `relatorio` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RelatorioVisibilidade" AS ENUM ('Publico', 'Privado', 'Restrito');

-- AlterTable
ALTER TABLE "relatorio" DROP COLUMN "eh_publico",
ADD COLUMN     "sistema" "ModuloSistema" NOT NULL DEFAULT 'SMAE',
ADD COLUMN     "visibilidade" "RelatorioVisibilidade" NOT NULL DEFAULT 'Privado';
