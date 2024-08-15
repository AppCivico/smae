/*
  Warnings:

  - You are about to drop the column `atualizado_em` on the `status_sei` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "status_sei" DROP COLUMN "atualizado_em",
ADD COLUMN     "proxima_sincronizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "relatorio_sincronizado_em" TIMESTAMPTZ(6),
ADD COLUMN     "resumo_sincronizado_em" TIMESTAMPTZ(6),
ADD COLUMN     "sincronizacao_errmsg" TEXT;
