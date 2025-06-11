-- AlterTable
ALTER TABLE "ps_dashboard_variavel" ADD COLUMN     "equipes_conferencia" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "equipes_liberacao" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "equipes_preenchimento" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
