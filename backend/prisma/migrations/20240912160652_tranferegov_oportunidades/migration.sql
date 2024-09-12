-- CreateEnum
CREATE TYPE "TransfereGovOportunidadeTipo" AS ENUM ('Voluntaria', 'Especifica', 'Emenda');

-- CreateEnum
CREATE TYPE "TransfereGovOportunidadeAvaliacao" AS ENUM ('Inadequada', 'Selecionada');

-- CreateTable
CREATE TABLE "transfere_gov_oportunidade" (
    "id" SERIAL NOT NULL,
    "tipo" "TransfereGovOportunidadeTipo" NOT NULL,
    "avaliacao" "TransfereGovOportunidadeAvaliacao",
    "transferencia_incorporada" BOOLEAN NOT NULL DEFAULT false,
    "cod_orgao_sup_programa" TEXT NOT NULL,
    "desc_orgao_sup_programa" TEXT NOT NULL,
    "cod_programa" TEXT NOT NULL,
    "nome_programa" TEXT NOT NULL,
    "sit_programa" TEXT NOT NULL,
    "ano_disponibilizacao" INTEGER NOT NULL,
    "data_disponibilizacao" DATE NOT NULL,
    "dt_ini_receb" DATE NOT NULL,
    "dt_fim_receb" DATE NOT NULL,
    "modalidade_programa" TEXT NOT NULL,
    "acao_orcamentaria" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMP(3),

    CONSTRAINT "transfere_gov_oportunidade_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transfere_gov_oportunidade" ADD CONSTRAINT "transfere_gov_oportunidade_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
