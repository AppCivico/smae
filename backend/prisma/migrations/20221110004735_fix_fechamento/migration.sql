/*
  Warnings:

  - You are about to drop the column `detalhamento` on the `meta_ciclo_fisico_fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `ponto_de_atencao` on the `meta_ciclo_fisico_fechamento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "meta_ciclo_fisico_fechamento" DROP COLUMN "detalhamento",
DROP COLUMN "ponto_de_atencao",
ADD COLUMN     "comentario" TEXT;
