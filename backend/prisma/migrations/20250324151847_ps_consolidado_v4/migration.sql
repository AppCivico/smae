delete from ps_dashboard_consolidado;
alter table ps_dashboard_consolidado add column variaveis int[] not null;

CREATE INDEX idx_ps_dashboard_consolidado_variaveis ON ps_dashboard_consolidado using gin(variaveis);
