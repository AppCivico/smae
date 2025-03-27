CREATE OR REPLACE VIEW view_dashboard_variavel_corrente AS
SELECT item_id, tipo, vcc.id AS variavel_ciclo_corrente_id, a.pdm_id
FROM ps_dashboard_consolidado a
JOIN variavel_ciclo_corrente vcc
ON vcc.variavel_id = ANY(a.variaveis);
