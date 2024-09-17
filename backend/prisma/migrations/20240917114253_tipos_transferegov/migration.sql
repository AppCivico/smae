/*
  Warnings:

  - Changed the type of `cod_orgao_sup_programa` on the `transfere_gov_oportunidade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cod_programa` on the `transfere_gov_oportunidade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id_programa` on the `transfere_gov_oportunidade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "transfere_gov_oportunidade" DROP COLUMN "cod_orgao_sup_programa",
ADD COLUMN     "cod_orgao_sup_programa" INTEGER NOT NULL,
DROP COLUMN "cod_programa",
ADD COLUMN     "cod_programa" INTEGER NOT NULL,
DROP COLUMN "id_programa",
ADD COLUMN     "id_programa" INTEGER NOT NULL;
