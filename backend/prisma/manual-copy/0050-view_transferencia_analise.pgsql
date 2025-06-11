DROP VIEW IF EXISTS view_transferencia_analise CASCADE; 
CREATE OR REPLACE VIEW view_transferencia_analise AS
SELECT
    t.id AS transferencia_id,
    t.workflow_finalizado,
    (
        SELECT 
            array_agg(DISTINCT tp.partido_id)
        FROM transferencia_parlamentar tp
        WHERE tp.transferencia_id = t.id
          AND tp.removido_em IS NULL AND tp.partido_id IS NOT NULL
    ) partido_id,
    t.workflow_etapa_atual_id,
    t.workflow_fase_atual_id,
    -- Ligação de parlamentar com transferência é uma table, 1 para N
    (
        SELECT 
            array_agg(DISTINCT tp.parlamentar_id)
        FROM transferencia_parlamentar tp
        WHERE tp.transferencia_id = t.id
          AND tp.removido_em IS NULL
    ) parlamentar_id,
    t.valor_total,
    dr.orgao_gestor_id AS distribuicao_orgao_id,
    dr.valor_total AS distribuicao_valor_total,
    t.prejudicada,
    t.esfera,
    t.ano
   FROM transferencia t
   LEFT JOIN distribuicao_recurso dr ON dr.transferencia_id = t.id AND dr.removido_em IS NULL AND NOT EXISTS (
        -- Verifica se a distribuição não possui um dos seguintes statuses: "Cancelada", "ImpedidaTecnicamente", "Finalizada"
        SELECT 1
        FROM distribuicao_recurso_status drs 
        -- Rows de status podem estar ligadas à um status base ou a um status customizado. ambos possuem uma coluna tipo
        LEFT JOIN distribuicao_status ds ON ds.id = drs.status_id AND ds.removido_em IS NULL
        LEFT JOIN distribuicao_status_base dsb ON dsb.id = drs.status_base_id
        WHERE drs.distribuicao_id = dr.id
          AND drs.removido_em IS NULL
          AND (ds.tipo IN ('Cancelada', 'ImpedidaTecnicamente', 'Finalizada') OR dsb.tipo IN ('Cancelada', 'ImpedidaTecnicamente', 'Finalizada'))
    )
    WHERE t.removido_em IS NULL;

DROP VIEW IF EXISTS view_ranking_transferencia_parlamentar;
CREATE OR REPLACE VIEW view_ranking_transferencia_parlamentar AS
SELECT
    pid AS parlamentar_id,
    COUNT(1) AS count,
    SUM(t.valor_total) AS valor,
    p.foto_upload_id AS parlamentar_foto_id,
    p.nome_popular
FROM view_transferencia_analise t
CROSS JOIN LATERAL UNNEST(t.parlamentar_id::int[]) AS pid
JOIN parlamentar p ON pid = p.id AND p.removido_em IS NULL
LEFT JOIN transferencia_parlamentar tp ON tp.transferencia_id = t.transferencia_id AND tp.parlamentar_id = pid AND tp.removido_em IS NULL
WHERE t.parlamentar_id IS NOT NULL
GROUP BY pid, p.foto_upload_id, p.nome_popular
ORDER BY SUM(t.valor_total) DESC;
