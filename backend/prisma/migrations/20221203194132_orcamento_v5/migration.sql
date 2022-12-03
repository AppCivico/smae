/*
  Warnings:

  - Added the required column `smae_soma_valor_planejado` to the `dotacao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dotacao" ADD COLUMN     "smae_soma_valor_planejado" DOUBLE PRECISION NOT NULL;
