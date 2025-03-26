delete from ps_dashboard_consolidado;
alter table ps_dashboard_consolidado add column variaveis int[] not null;

CREATE INDEX idx_ps_dashboard_consolidado_variaveis ON ps_dashboard_consolidado using gin(variaveis);

drop view if EXISTS ps_dashboard_meta_stats;

ALTER TABLE "ps_dashboard_consolidado" DROP COLUMN "orcamento_preenchido";
ALTER TABLE "ps_dashboard_consolidado" DROP COLUMN "orcamento_total";

ALTER TABLE "ps_dashboard_consolidado" ADD COLUMN     "orcamento_preenchido" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "ps_dashboard_consolidado" ADD COLUMN     "orcamento_total" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
