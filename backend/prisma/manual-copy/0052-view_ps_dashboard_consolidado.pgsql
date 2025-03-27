CREATE OR REPLACE VIEW view_ps_dashboard_consolidado AS
SELECT
    m.codigo AS meta_codigo,
    m.titulo AS meta_titulo,
    i.codigo AS iniciativa_codigo,
    i.titulo AS iniciativa_titulo,
    a.codigo AS atividade_codigo,
    a.titulo AS atividade_titulo,
    x.*
FROM
    ps_dashboard_consolidado x
LEFT JOIN
    meta m ON m.id = x.meta_id
LEFT JOIN
    iniciativa i ON i.id = x.iniciativa_id
LEFT JOIN
    atividade a ON a.id = x.atividade_id
ORDER BY
    m.codigo,
    i.codigo NULLS FIRST,
    a.codigo NULLS FIRST;
