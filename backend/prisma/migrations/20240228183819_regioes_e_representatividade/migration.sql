/*
  Warnings:

  - You are about to drop the `MandatoBancada` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ParlamentarAssessor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ParlamentarMandato` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DadosEleicaoNivel" AS ENUM ('Estado', 'Municipio', 'Subprefeitura');

-- CreateEnum
CREATE TYPE "MunicipioTipo" AS ENUM ('Capital', 'Interior');

-- CreateEnum
CREATE TYPE "SubprefeituraRegiao" AS ENUM ('Norte', 'Sul', 'Leste', 'Oeste', 'Centro');

-- DropForeignKey
ALTER TABLE "MandatoBancada" DROP CONSTRAINT "MandatoBancada_bancada_id_fkey";

-- DropForeignKey
ALTER TABLE "MandatoBancada" DROP CONSTRAINT "MandatoBancada_mandato_id_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarAssessor" DROP CONSTRAINT "ParlamentarAssessor_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarAssessor" DROP CONSTRAINT "ParlamentarAssessor_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarAssessor" DROP CONSTRAINT "ParlamentarAssessor_parlamentar_id_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarAssessor" DROP CONSTRAINT "ParlamentarAssessor_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarMandato" DROP CONSTRAINT "ParlamentarMandato_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarMandato" DROP CONSTRAINT "ParlamentarMandato_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarMandato" DROP CONSTRAINT "ParlamentarMandato_eleicao_id_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarMandato" DROP CONSTRAINT "ParlamentarMandato_mandato_principal_id_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarMandato" DROP CONSTRAINT "ParlamentarMandato_parlamentar_id_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarMandato" DROP CONSTRAINT "ParlamentarMandato_partido_atual_id_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarMandato" DROP CONSTRAINT "ParlamentarMandato_partido_candidatura_id_fkey";

-- DropForeignKey
ALTER TABLE "ParlamentarMandato" DROP CONSTRAINT "ParlamentarMandato_removido_por_fkey";

-- DropTable
DROP TABLE "MandatoBancada";

-- DropTable
DROP TABLE "ParlamentarAssessor";

-- DropTable
DROP TABLE "ParlamentarMandato";

-- CreateTable
CREATE TABLE "eleicao_comparecimento" (
    "id" SERIAL NOT NULL,
    "eleicao_id" INTEGER NOT NULL,
    "nivel" "DadosEleicaoNivel" NOT NULL,
    "valor" INTEGER NOT NULL,
    "estado_id" INTEGER,
    "municipio_id" INTEGER,
    "subprefeitura_id" INTEGER,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "eleicao_comparecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estado" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,

    CONSTRAINT "estado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipio" (
    "id" SERIAL NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "MunicipioTipo" NOT NULL,

    CONSTRAINT "municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subprefeitura" (
    "id" SERIAL NOT NULL,
    "municipio_id" INTEGER NOT NULL,
    "regiao" "SubprefeituraRegiao" NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "subprefeitura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parlamentar_mandato" (
    "id" SERIAL NOT NULL,
    "parlamentar_id" INTEGER NOT NULL,
    "eleicao_id" INTEGER NOT NULL,
    "estado_id" INTEGER,
    "municipio_id" INTEGER,
    "subprefeitura_id" INTEGER,
    "partido_candidatura_id" INTEGER NOT NULL,
    "partido_atual_id" INTEGER NOT NULL,
    "gabinete" TEXT NOT NULL,
    "eleito" BOOLEAN NOT NULL,
    "cargo" "ParlamentarCargo" NOT NULL,
    "uf" "ParlamentarUF" NOT NULL,
    "suplencia" "ParlamentarSuplente",
    "endereco" TEXT,
    "votos_estado" BIGINT,
    "votos_capital" BIGINT,
    "votos_interior" BIGINT,
    "mandato_principal_id" INTEGER,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "parlamentar_mandato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parlamentar_assessor" (
    "id" SERIAL NOT NULL,
    "parlamentar_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "parlamentar_assessor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandato_bancada" (
    "id" SERIAL NOT NULL,
    "mandato_id" INTEGER NOT NULL,
    "bancada_id" INTEGER NOT NULL,

    CONSTRAINT "mandato_bancada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandato_representatividade" (
    "id" SERIAL NOT NULL,
    "nivel" "DadosEleicaoNivel" NOT NULL,
    "estado_id" INTEGER,
    "municipio_id" INTEGER,
    "subprefeitura_id" INTEGER,
    "numero_votos" INTEGER NOT NULL,
    "pct_participacao" DOUBLE PRECISION NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "mandato_representatividade_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "eleicao_comparecimento" ADD CONSTRAINT "eleicao_comparecimento_eleicao_id_fkey" FOREIGN KEY ("eleicao_id") REFERENCES "eleicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleicao_comparecimento" ADD CONSTRAINT "eleicao_comparecimento_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleicao_comparecimento" ADD CONSTRAINT "eleicao_comparecimento_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleicao_comparecimento" ADD CONSTRAINT "eleicao_comparecimento_subprefeitura_id_fkey" FOREIGN KEY ("subprefeitura_id") REFERENCES "subprefeitura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleicao_comparecimento" ADD CONSTRAINT "eleicao_comparecimento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleicao_comparecimento" ADD CONSTRAINT "eleicao_comparecimento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleicao_comparecimento" ADD CONSTRAINT "eleicao_comparecimento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipio" ADD CONSTRAINT "municipio_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subprefeitura" ADD CONSTRAINT "subprefeitura_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subprefeitura" ADD CONSTRAINT "subprefeitura_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subprefeitura" ADD CONSTRAINT "subprefeitura_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subprefeitura" ADD CONSTRAINT "subprefeitura_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "parlamentar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_eleicao_id_fkey" FOREIGN KEY ("eleicao_id") REFERENCES "eleicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_subprefeitura_id_fkey" FOREIGN KEY ("subprefeitura_id") REFERENCES "subprefeitura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_partido_candidatura_id_fkey" FOREIGN KEY ("partido_candidatura_id") REFERENCES "partido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_partido_atual_id_fkey" FOREIGN KEY ("partido_atual_id") REFERENCES "partido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_mandato_principal_id_fkey" FOREIGN KEY ("mandato_principal_id") REFERENCES "parlamentar_mandato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_mandato" ADD CONSTRAINT "parlamentar_mandato_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_assessor" ADD CONSTRAINT "parlamentar_assessor_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "parlamentar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_assessor" ADD CONSTRAINT "parlamentar_assessor_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_assessor" ADD CONSTRAINT "parlamentar_assessor_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_assessor" ADD CONSTRAINT "parlamentar_assessor_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_bancada" ADD CONSTRAINT "mandato_bancada_mandato_id_fkey" FOREIGN KEY ("mandato_id") REFERENCES "parlamentar_mandato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_bancada" ADD CONSTRAINT "mandato_bancada_bancada_id_fkey" FOREIGN KEY ("bancada_id") REFERENCES "bancada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_representatividade" ADD CONSTRAINT "mandato_representatividade_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_representatividade" ADD CONSTRAINT "mandato_representatividade_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_representatividade" ADD CONSTRAINT "mandato_representatividade_subprefeitura_id_fkey" FOREIGN KEY ("subprefeitura_id") REFERENCES "subprefeitura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_representatividade" ADD CONSTRAINT "mandato_representatividade_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_representatividade" ADD CONSTRAINT "mandato_representatividade_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_representatividade" ADD CONSTRAINT "mandato_representatividade_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
