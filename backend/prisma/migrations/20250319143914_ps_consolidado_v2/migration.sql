-- AlterTable
ALTER TABLE "ps_dashboard_consolidado" ADD COLUMN     "equipes" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "equipes_orgaos" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "variaveis_total_no_ciclo" INTEGER NOT NULL DEFAULT 0;
-- AlterTable
ALTER TABLE "ps_dashboard_consolidado" ADD COLUMN     "cronograma_preenchido" INTEGER NOT NULL DEFAULT 0;
-- AlterTable
ALTER TABLE "ps_dashboard_consolidado" ALTER COLUMN "fase_atual" DROP NOT NULL,
ALTER COLUMN "fase_atual" DROP DEFAULT,
ALTER COLUMN "ciclo_fisico_id" DROP NOT NULL;
