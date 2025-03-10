/*
  Warnings:

  - You are about to drop the column `erros` on the `relatorio_fila` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "relatorio" DROP CONSTRAINT "relatorio_arquivo_id_fkey";

-- AlterTable
ALTER TABLE "relatorio" ALTER COLUMN "arquivo_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "relatorio_fila" DROP COLUMN "erros",
ADD COLUMN     "err_msg" TEXT;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

