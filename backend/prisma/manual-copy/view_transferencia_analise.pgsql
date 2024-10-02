CREATE OR REPLACE VIEW view_transferencia_analise AS
SELECT
    t.id AS transferencia_id,
    t.workflow_finalizado,
    t.partido_id,
    t.workflow_etapa_atual_id,
    t.workflow_fase_atual_id,
    t.parlamentar_id,
    t.valor_total,
    dr.orgao_gestor_id AS distribuicao_orgao_id,
    dr.valor_total AS distribuicao_valor_total,
    t.prejudicada,
    t.esfera,
    t.ano
FROM transferencia t
LEFT JOIN parlamentar p ON t.parlamentar_id = p.id AND p.removido_em IS NULL
LEFT JOIN distribuicao_recurso dr ON dr.transferencia_id = t.id AND dr.removido_em IS NULL
WHERE t.removido_em IS NULL;

CREATE OR REPLACE VIEW view_ranking_transferencia_parlamentar AS
SELECT
    t.parlamentar_id,
    count(1) AS count,
    SUM(valor_total) AS valor,
    p.foto_upload_id AS parlamentar_foto_id
FROM view_transferencia_analise t
JOIN parlamentar p ON t.parlamentar_id = p.id AND p.removido_em IS NULL
WHERE t.parlamentar_id IS NOT NULL
GROUP BY t.parlamentar_id, p.foto_upload_id
ORDER BY valor DESC;