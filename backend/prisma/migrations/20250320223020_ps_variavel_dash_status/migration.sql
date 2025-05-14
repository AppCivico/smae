/*
  Warnings:

  - You are about to drop the column `orgaos` on the `ps_dashboard_variavel` table. All the data in the column will be lost.
  - Added the required column `fase` to the `ps_dashboard_variavel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ps_dashboard_variavel" DROP COLUMN "orgaos",
ADD COLUMN     "fase" "VariavelFase" NOT NULL,
ADD COLUMN     "fase_liberacao_preenchida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fase_preenchimento_preenchida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fase_validacao_preenchida" BOOLEAN NOT NULL DEFAULT false;
