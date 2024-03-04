/*
  Warnings:

  - You are about to drop the column `atuacao` on the `parlamentar` table. All the data in the column will be lost.
  - You are about to drop the column `biografia` on the `parlamentar` table. All the data in the column will be lost.
  - You are about to drop the `mandato_bancada` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parlamentar_assessor` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ParlamentarEquipeTipo" AS ENUM ('Assessor', 'Contato');

-- DropForeignKey
ALTER TABLE "mandato_bancada" DROP CONSTRAINT "mandato_bancada_bancada_id_fkey";

-- DropForeignKey
ALTER TABLE "mandato_bancada" DROP CONSTRAINT "mandato_bancada_mandato_id_fkey";

-- DropForeignKey
ALTER TABLE "parlamentar_assessor" DROP CONSTRAINT "parlamentar_assessor_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "parlamentar_assessor" DROP CONSTRAINT "parlamentar_assessor_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "parlamentar_assessor" DROP CONSTRAINT "parlamentar_assessor_parlamentar_id_fkey";

-- DropForeignKey
ALTER TABLE "parlamentar_assessor" DROP CONSTRAINT "parlamentar_assessor_removido_por_fkey";

-- AlterTable
ALTER TABLE "parlamentar" DROP COLUMN "atuacao",
DROP COLUMN "biografia";

-- AlterTable
ALTER TABLE "parlamentar_mandato" ADD COLUMN     "atuacao" TEXT,
ADD COLUMN     "biografia" TEXT;

-- DropTable
DROP TABLE "mandato_bancada";

-- DropTable
DROP TABLE "parlamentar_assessor";

-- CreateTable
CREATE TABLE "parlamentar_equipe" (
    "id" SERIAL NOT NULL,
    "parlamentar_id" INTEGER NOT NULL,
    "tipo" "ParlamentarEquipeTipo" NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "parlamentar_equipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "parlamentar_equipe" ADD CONSTRAINT "parlamentar_equipe_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "parlamentar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_equipe" ADD CONSTRAINT "parlamentar_equipe_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_equipe" ADD CONSTRAINT "parlamentar_equipe_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_equipe" ADD CONSTRAINT "parlamentar_equipe_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
