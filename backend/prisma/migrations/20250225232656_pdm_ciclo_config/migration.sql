/*
  Warnings:

  - A unique constraint covering the columns `[pdm_id,data_ciclo]` on the table `ciclo_fisico` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TipoCicloFisico" AS ENUM ('PDM', 'CicloConfig');

-- AlterTable
ALTER TABLE "ciclo_fisico" ADD COLUMN     "tipo" "TipoCicloFisico" NOT NULL DEFAULT 'PDM';

ALTER TABLE "pdm" ADD COLUMN     "sistema" "ModuloSistema" NOT NULL DEFAULT 'SMAE';

update pdm set sistema = 'PDM' where tipo = 'PDM';
update pdm set sistema = 'PlanoSetorial' where tipo = 'PS';

update pdm set sistema = 'ProgramaDeMetas' where tipo = 'PDM' and id  >= (
    select min(id) from pdm where tipo = 'PS'
);

-- CreateTable
CREATE TABLE "pdm_ciclo_config" (
    "id" SERIAL NOT NULL,
    "meses" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "data_inicio" DATE,
    "data_fim" DATE,
    "pdm_id" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN,
    "criado_por" INTEGER,
    "removido_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "pdm_ciclo_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pdm_ciclo_config_pdm_id_ultima_revisao_key" ON "pdm_ciclo_config"("pdm_id", "ultima_revisao");

-- CreateIndex
CREATE UNIQUE INDEX "ciclo_fisico_pdm_id_data_ciclo_key" ON "ciclo_fisico"("pdm_id", "data_ciclo");

-- AddForeignKey
ALTER TABLE "pdm_ciclo_config" ADD CONSTRAINT "pdm_ciclo_config_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

drop index if exists ix_ciclo_fisico_uniq_ativo;

create unique index ix_ciclo_fisico_uniq_ativo on ciclo_fisico(ativo) where ativo=true and tipo='PDM';
