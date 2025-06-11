-- AlterEnum
ALTER TYPE "TransfereGovOportunidadeTipo" ADD VALUE 'Especial';

-- AlterTable
ALTER TABLE "transfere_gov_oportunidade" ADD COLUMN     "finalidades" TEXT,
ALTER COLUMN "desc_orgao_sup_programa" DROP NOT NULL,
ALTER COLUMN "ano_disponibilizacao" DROP NOT NULL,
ALTER COLUMN "data_disponibilizacao" DROP NOT NULL,
ALTER COLUMN "dt_ini_receb" DROP NOT NULL,
ALTER COLUMN "dt_fim_receb" DROP NOT NULL,
ALTER COLUMN "cod_orgao_sup_programa" DROP NOT NULL;

-- insert into smae_config (key ,value) values ('TRANSFEREGOV_API_PREFIX', 'http://smae_transferegov:80/comunicados/');
-- insert into smae_config (key ,value) values ('TRANSFEREGOV_API_ESPECIAIS_PREFIX', 'http://smae_transferegov:80/especiais/');

