/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `transfere_gov_oportunidade` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hash` to the `transfere_gov_oportunidade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_programa` to the `transfere_gov_oportunidade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `natureza_juridica_programa` to the `transfere_gov_oportunidade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transfere_gov_oportunidade" ADD COLUMN     "hash" TEXT NOT NULL,
ADD COLUMN     "id_programa" TEXT NOT NULL,
ADD COLUMN     "natureza_juridica_programa" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "transfere_gov_oportunidade_hash_key" ON "transfere_gov_oportunidade"("hash");
