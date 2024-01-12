-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "principais_etapas_antigo" TEXT,
ALTER COLUMN "principais_etapas" DROP NOT NULL;

update projeto set principais_etapas_antigo = principais_etapas;
update projeto set principais_etapas = escopo;

