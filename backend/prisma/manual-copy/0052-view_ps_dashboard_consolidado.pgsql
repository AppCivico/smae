drop view if exists view_ps_dashboard_consolidado;
CREATE OR REPLACE VIEW view_ps_dashboard_consolidado AS
SELECT
    m.codigo AS meta_codigo,
    m.titulo AS meta_titulo,
    i.codigo AS iniciativa_codigo,
    i.titulo AS iniciativa_titulo,
    a.codigo AS atividade_codigo,
    a.titulo AS atividade_titulo,
    -- Add ordering columns that Prisma can use (with NULL handling for correct ordering)
    COALESCE(m.codigo, '') AS order_meta,
    -- For iniciativa, we want NULL values first within each meta group
    CASE
        WHEN i.codigo IS NULL THEN E'\001\001\001\001\001\001\001\001\001\001'
        ELSE COALESCE(i.codigo, '')
    END AS order_iniciativa,
    -- For atividade, we want NULL values first within each iniciativa group
    CASE
        WHEN a.codigo IS NULL THEN E'\001\001\001\001\001\001\001\001\001\001'
        ELSE COALESCE(a.codigo, '')
    END AS order_atividade,
    x.*
FROM
    ps_dashboard_consolidado x
LEFT JOIN
    meta m ON m.id = x.meta_id
LEFT JOIN
    iniciativa i ON i.id = x.iniciativa_id
LEFT JOIN
    atividade a ON a.id = x.atividade_id;
