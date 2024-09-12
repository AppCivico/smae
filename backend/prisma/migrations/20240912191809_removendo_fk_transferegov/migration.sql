/*
  Warnings:

  - You are about to drop the column `atualizado_por` on the `transfere_gov_oportunidade` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "transfere_gov_oportunidade" DROP CONSTRAINT "transfere_gov_oportunidade_atualizado_por_fkey";

-- AlterTable
ALTER TABLE "transfere_gov_oportunidade" DROP COLUMN "atualizado_por";
