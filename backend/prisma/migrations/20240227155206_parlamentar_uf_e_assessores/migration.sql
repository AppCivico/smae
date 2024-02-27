/*
  Warnings:

  - You are about to drop the column `regiao_id` on the `parlamentar` table. All the data in the column will be lost.
  - Added the required column `uf` to the `ParlamentarMandato` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ParlamentarUF" AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

-- DropForeignKey
ALTER TABLE "parlamentar" DROP CONSTRAINT "parlamentar_regiao_id_fkey";

-- AlterTable
ALTER TABLE "ParlamentarMandato" ADD COLUMN     "uf" "ParlamentarUF" NOT NULL,
ALTER COLUMN "suplencia" DROP NOT NULL;

-- AlterTable
ALTER TABLE "parlamentar" DROP COLUMN "regiao_id";

-- CreateTable
CREATE TABLE "ParlamentarAssessor" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "ParlamentarAssessor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ParlamentarAssessor" ADD CONSTRAINT "ParlamentarAssessor_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarAssessor" ADD CONSTRAINT "ParlamentarAssessor_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarAssessor" ADD CONSTRAINT "ParlamentarAssessor_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
