begin;

/*
  Warnings:

  - You are about to drop the column `ano` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `atualizado_em` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `atualizado_por` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `criado_em` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `criado_por` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `fase_atual` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `mes` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `removido_em` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `removido_por` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `ciclo_fisico_id` on the `painel_versao` table. All the data in the column will be lost.
  - You are about to drop the column `regiao_id` on the `serie_indicador` table. All the data in the column will be lost.
  - Added the required column `acordar_ciclo_em` to the `ciclo_fisico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ciclo_fase_atual` to the `ciclo_fisico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data_ciclo` to the `ciclo_fisico` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CicloFase" AS ENUM ('Coleta', 'Analise', 'Risco', 'Fechamento');

-- DropForeignKey
ALTER TABLE "ciclo_fisico" DROP CONSTRAINT "ciclo_fisico_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "ciclo_fisico" DROP CONSTRAINT "ciclo_fisico_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "ciclo_fisico" DROP CONSTRAINT "ciclo_fisico_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "painel_versao" DROP CONSTRAINT "painel_versao_ciclo_fisico_id_fkey";

-- DropForeignKey
ALTER TABLE "serie_indicador" DROP CONSTRAINT "serie_indicador_regiao_id_fkey";

-- AlterTable
ALTER TABLE "ciclo_fisico" DROP COLUMN "ano",
DROP COLUMN "atualizado_em",
DROP COLUMN "atualizado_por",
DROP COLUMN "criado_em",
DROP COLUMN "criado_por",
DROP COLUMN "fase_atual",
DROP COLUMN "mes",
DROP COLUMN "removido_em",
DROP COLUMN "removido_por",
ADD COLUMN     "acordar_ciclo_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "acordar_ciclo_errmsg" TEXT,
ADD COLUMN     "acordar_ciclo_executou_em" TIMESTAMP(3),
ADD COLUMN     "ciclo_fase_atual" "CicloFase" NOT NULL,
ADD COLUMN     "data_ciclo" DATE NOT NULL,
ALTER COLUMN "ativo" SET DEFAULT false;

-- AlterTable
ALTER TABLE "painel_versao" DROP COLUMN "ciclo_fisico_id";

-- AlterTable
ALTER TABLE "serie_indicador" DROP COLUMN "regiao_id";

-- CreateTable
CREATE TABLE "ciclo_fases_base" (
    "id" SERIAL NOT NULL,
    "ciclo_fase" "CicloFase" NOT NULL,
    "n_dias_do_inicio_mes" INTEGER NOT NULL,
    "n_dias_antes_do_fim_do_mes" INTEGER NOT NULL,

    CONSTRAINT "ciclo_fases_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclo_fases_pdm_config" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "ciclo_fase" "CicloFase" NOT NULL,
    "n_dias_do_inicio_mes" INTEGER NOT NULL,
    "n_dias_antes_do_fim_do_mes" INTEGER,

    CONSTRAINT "ciclo_fases_pdm_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclo_fisico_fase" (
    "id" SERIAL NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "ciclo_fase" "CicloFase" NOT NULL,

    CONSTRAINT "ciclo_fisico_fase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_serie_indicador_indicador_id_data_valor" ON "serie_indicador"("serie", "indicador_id", "data_valor");

-- AddForeignKey
ALTER TABLE "ciclo_fases_pdm_config" ADD CONSTRAINT "ciclo_fases_pdm_config_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclo_fisico_fase" ADD CONSTRAINT "ciclo_fisico_fase_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;




insert into ciclo_fases_base (ciclo_fase, n_dias_do_inicio_mes, n_dias_antes_do_fim_do_mes)
values
('Coleta', 5, -5),
('Analise', 10, -5),
('Risco', 15, -5),
('Fechamento', 20, 0)
;

commit;
