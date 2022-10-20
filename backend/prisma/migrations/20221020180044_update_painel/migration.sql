/*
  Warnings:

  - You are about to drop the column `periodo` on the `painel` table. All the data in the column will be lost.
  - You are about to drop the column `acumulado_periodo` on the `painel_conteudo` table. All the data in the column will be lost.
  - You are about to drop the column `indicador_id` on the `painel_conteudo` table. All the data in the column will be lost.
  - You are about to drop the column `mostra_acumulado` on the `painel_conteudo` table. All the data in the column will be lost.
  - You are about to drop the column `mostra_planejado` on the `painel_conteudo` table. All the data in the column will be lost.
  - You are about to drop the column `painel_versao_id` on the `painel_conteudo` table. All the data in the column will be lost.
  - You are about to drop the column `peridiocidade` on the `painel_conteudo` table. All the data in the column will be lost.
  - You are about to drop the `painel_versao` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `periodicidade` to the `painel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mostrar_acumulado` to the `painel_conteudo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mostrar_indicador` to the `painel_conteudo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mostrar_planejado` to the `painel_conteudo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodicidade` to the `painel_conteudo` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `periodo` on the `painel_conteudo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Periodo" AS ENUM ('Corrente', 'Anteriores', 'Todos', 'EntreDatas');

-- CreateEnum
CREATE TYPE "PainelConteudoTipoDetalhe" AS ENUM ('Variavel', 'Iniciativa', 'Atividade');

-- DropForeignKey
ALTER TABLE "painel_conteudo" DROP CONSTRAINT "painel_conteudo_indicador_id_fkey";

-- DropForeignKey
ALTER TABLE "painel_conteudo" DROP CONSTRAINT "painel_conteudo_painel_versao_id_fkey";

-- DropForeignKey
ALTER TABLE "painel_versao" DROP CONSTRAINT "painel_versao_painel_id_fkey";

-- DropIndex
DROP INDEX "painel_conteudo_painel_versao_id_ordem_key";

-- AlterTable
ALTER TABLE "painel" DROP COLUMN "periodo",
ADD COLUMN     "mostrar_acumulado_por_padrao" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mostrar_indicador_por_padrao" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mostrar_planejado_por_padrao" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "periodicidade" "Periodicidade" NOT NULL;

-- AlterTable
ALTER TABLE "painel_conteudo" DROP COLUMN "acumulado_periodo",
DROP COLUMN "indicador_id",
DROP COLUMN "mostra_acumulado",
DROP COLUMN "mostra_planejado",
DROP COLUMN "painel_versao_id",
DROP COLUMN "peridiocidade",
ADD COLUMN     "indicadorId" INTEGER,
ADD COLUMN     "mostrar_acumulado" BOOLEAN NOT NULL,
ADD COLUMN     "mostrar_indicador" BOOLEAN NOT NULL,
ADD COLUMN     "mostrar_planejado" BOOLEAN NOT NULL,
ADD COLUMN     "periodicidade" "Periodicidade" NOT NULL,
ADD COLUMN     "periodo_fim" DATE,
ADD COLUMN     "periodo_inicio" DATE,
ADD COLUMN     "periodo_valor" INTEGER,
DROP COLUMN "periodo",
ADD COLUMN     "periodo" "Periodo" NOT NULL;

-- DropTable
DROP TABLE "painel_versao";

-- CreateTable
CREATE TABLE "painel_conteudo_detalhe" (
    "id" SERIAL NOT NULL,
    "variavel_id" INTEGER,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "painel_conteudo_id" INTEGER NOT NULL,
    "pai_id" INTEGER,
    "mostrar_indicador" BOOLEAN NOT NULL,
    "ordem" INTEGER NOT NULL,
    "tipo" "PainelConteudoTipoDetalhe" NOT NULL,

    CONSTRAINT "painel_conteudo_detalhe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "painel_conteudo" ADD CONSTRAINT "painel_conteudo_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "indicador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_conteudo_detalhe" ADD CONSTRAINT "painel_conteudo_detalhe_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_conteudo_detalhe" ADD CONSTRAINT "painel_conteudo_detalhe_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_conteudo_detalhe" ADD CONSTRAINT "painel_conteudo_detalhe_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_conteudo_detalhe" ADD CONSTRAINT "painel_conteudo_detalhe_painel_conteudo_id_fkey" FOREIGN KEY ("painel_conteudo_id") REFERENCES "painel_conteudo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_conteudo_detalhe" ADD CONSTRAINT "painel_conteudo_detalhe_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "painel_conteudo_detalhe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
