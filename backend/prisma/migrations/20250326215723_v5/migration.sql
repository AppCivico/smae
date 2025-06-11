delete from ps_dashboard_consolidado;

-- CreateEnum
CREATE TYPE "PsDashboardConsolidadoTipo" AS ENUM ('meta', 'iniciativa', 'atividade');

-- AlterTable
ALTER TABLE "ps_dashboard_consolidado" DROP COLUMN "tipo" CASCADE;

ALTER TABLE "ps_dashboard_consolidado" ADD COLUMN     "tipo" "PsDashboardConsolidadoTipo" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ps_dashboard_consolidado_item_id_tipo_key" ON "ps_dashboard_consolidado"("item_id", "tipo");


