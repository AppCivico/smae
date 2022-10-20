/*
  Warnings:

  - Added the required column `painel_id` to the `painel_conteudo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "painel_conteudo" ADD COLUMN     "painel_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "painel_conteudo" ADD CONSTRAINT "painel_conteudo_painel_id_fkey" FOREIGN KEY ("painel_id") REFERENCES "painel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
