/*
  Warnings:

  - You are about to drop the column `ha_pedido_de_complementacao` on the `serie_variavel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "painel_conteudo" ADD COLUMN     "mostrar_acumulado_periodo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "serie_variavel" DROP COLUMN "ha_pedido_de_complementacao";
