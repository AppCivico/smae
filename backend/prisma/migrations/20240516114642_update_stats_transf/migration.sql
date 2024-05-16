UPDATE transferencia t
SET
    workflow_finalizado = true
WHERE NOT EXISTS (
    SELECT 1 FROM transferencia_andamento WHERE transferencia_id = t.id AND data_termino IS NULL
);

UPDATE transferencia
SET
    workflow_etapa_atual_id = subquery.workflow_etapa_id,
    workflow_fase_atual_id = subquery.workflow_fase_id
FROM (
    SELECT DISTINCT ON (ta.transferencia_id)
        ta.transferencia_id,
        ta.workflow_etapa_id,
        ta.workflow_fase_id
    FROM transferencia_andamento ta
    WHERE ta.data_inicio IS NOT NULL
    ORDER BY ta.transferencia_id, ta.data_inicio DESC
) AS subquery
WHERE
    transferencia.id = subquery.transferencia_id;