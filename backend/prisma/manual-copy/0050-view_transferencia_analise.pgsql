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
        -- Exclui distribuições que passaram por um status "terminal inválido"
        -- (Cancelada, Declinada, ImpedidaTecnicamente, Redirecionada, Finalizada), pois não
        -- representam mais a distribuição válida da transferência.
        --
        -- O enum DistribuicaoStatusTipo tem duas gerações de valores: a antiga, com nomes
        -- literais (Cancelada, Declinada, ...), e a nova/genérica usada pelos status base atuais
        -- (Terminal agrupa Cancelada/Declinada/ImpedidaTecnicamente/Redirecionada; ConcluidoComSucesso
        -- corresponde a Finalizada). Precisamos cobrir ambas. NÃO usamos permite_novos_registros
        -- porque dados legados (seed com upsert update:{}) deixaram esse flag inconsistente.
        SELECT 1
        FROM distribuicao_recurso_status drs
        -- Rows de status podem estar ligadas à um status base ou a um status customizado. ambos possuem a coluna tipo
        LEFT JOIN distribuicao_status ds ON ds.id = drs.status_id AND ds.removido_em IS NULL
        LEFT JOIN distribuicao_status_base dsb ON dsb.id = drs.status_base_id
        WHERE drs.distribuicao_id = dr.id
          AND drs.removido_em IS NULL
          AND COALESCE(ds.tipo, dsb.tipo)::text IN (
                -- enum antigo (nomes literais)
                'Cancelada', 'Declinada', 'ImpedidaTecnicamente', 'Redirecionada', 'Finalizada',
                -- enum novo (genérico) usado pelos status base atuais
                'Terminal', 'ConcluidoComSucesso'
          )
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
FROM (
    SELECT DISTINCT transferencia_id, valor_total, parlamentar_id
    FROM view_transferencia_analise
) t
CROSS JOIN LATERAL UNNEST(t.parlamentar_id::int[]) AS pid
JOIN parlamentar p ON pid = p.id AND p.removido_em IS NULL
WHERE t.parlamentar_id IS NOT NULL
GROUP BY pid, p.foto_upload_id, p.nome_popular
ORDER BY SUM(t.valor_total) DESC;
