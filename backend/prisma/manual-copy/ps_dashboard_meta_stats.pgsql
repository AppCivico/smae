CREATE OR REPLACE VIEW ps_dashboard_meta_stats_v2 AS
WITH meta_consolidated AS (
    SELECT
        pdm_id,
        meta_id,
        -- For arrays, we'll use array_cat to combine them
        (
            SELECT COALESCE( array_agg(DISTINCT e), '{}'::int[] )
            FROM (
                SELECT unnest(equipes) as e
                FROM ps_dashboard_consolidado sub
                WHERE sub.meta_id = main.meta_id AND sub.pdm_id = main.pdm_id
                    AND sub.equipes IS NOT NULL
            ) subquery
            WHERE e IS NOT NULL
        ) AS equipes,

        (
            SELECT
                COALESCE(array_agg(DISTINCT o), '{}'::int[])
            FROM (
                SELECT unnest(equipes_orgaos) as o
                FROM ps_dashboard_consolidado sub
                WHERE sub.meta_id = main.meta_id AND sub.pdm_id = main.pdm_id
                    AND sub.equipes_orgaos IS NOT NULL
            ) subquery
            WHERE o IS NOT NULL
        ) AS equipes_orgaos,

        -- Boolean flags - if ANY item in the meta has this flag, the meta has it
        BOOL_OR(pendente) AS has_pendente,

        -- Variables - consolidated at meta level
        SUM(variaveis_total) AS total_variaveis,
        SUM(variaveis_total_no_ciclo) AS total_variaveis_no_ciclo,
        SUM(variaveis_liberadas) AS total_variaveis_liberadas,

        -- Cronograma - consolidated at meta level
        SUM(cronograma_total) AS total_cronograma,
        SUM(cronograma_atraso_inicio) AS total_cronograma_atraso_inicio,
        SUM(cronograma_atraso_fim) AS total_cronograma_atraso_fim,

        -- Orçamento - consolidated at meta level
        SUM(
            COALESCE((SELECT SUM(x) FROM unnest(orcamento_total) AS x), 0)
        ) AS total_orcamento,

        SUM(
            COALESCE((SELECT SUM(x) FROM unnest(orcamento_preenchido) AS x), 0)
        ) AS total_orcamento_preenchido,

        -- Phases - only relevant for metas, so we'll take values from tipo='meta' records
        BOOL_OR(CASE WHEN tipo = 'meta' AND ciclo_fisico_id IS NOT NULL THEN fase_analise_preenchida ELSE FALSE END) AS fase_analise_preenchida,
        BOOL_OR(CASE WHEN tipo = 'meta' AND ciclo_fisico_id IS NOT NULL THEN fase_risco_preenchida ELSE FALSE END) AS fase_risco_preenchida,
        BOOL_OR(CASE WHEN tipo = 'meta' AND ciclo_fisico_id IS NOT NULL THEN fase_fechamento_preenchida ELSE FALSE END) AS fase_fechamento_preenchida,
        BOOL_OR(ciclo_fisico_id IS NOT NULL) AS has_ciclo_fisico
    FROM
        ps_dashboard_consolidado main
    GROUP BY
        pdm_id, meta_id
)
SELECT
    pdm_id,
    meta_id,
    equipes,
    equipes_orgaos,

    -- Com/sem pendência
    CASE WHEN has_pendente THEN 1 ELSE 0 END AS pendente,

    -- Variáveis status - now at meta level
    CASE WHEN total_variaveis > 0 AND total_variaveis_liberadas = total_variaveis_no_ciclo THEN 1 ELSE 0 END AS var_liberadas,
    CASE WHEN total_variaveis > 0 AND total_variaveis_liberadas < total_variaveis_no_ciclo THEN 1 ELSE 0 END AS var_a_liberar,

    -- Cronograma status
    CASE WHEN total_cronograma > 0 AND total_cronograma_atraso_inicio = 0 AND total_cronograma_atraso_fim = 0
        THEN 1 ELSE 0 END AS crono_preenchido,
    CASE WHEN total_cronograma > 0 AND (total_cronograma_atraso_inicio > 0 OR total_cronograma_atraso_fim > 0)
        THEN 1 ELSE 0 END AS crono_a_preencher,

    -- Orçamento status
    CASE WHEN total_orcamento > 0 AND total_orcamento_preenchido = total_orcamento
         THEN 1 ELSE 0 END AS orc_preenchido,
    CASE WHEN total_orcamento > 0 AND total_orcamento_preenchido < total_orcamento
         THEN 1 ELSE 0 END AS orc_a_preencher,

    -- Qualificação (fase_analise) status
    CASE WHEN has_ciclo_fisico AND fase_analise_preenchida THEN 1 ELSE 0 END AS qualif_preenchida,
    CASE WHEN has_ciclo_fisico AND NOT fase_analise_preenchida THEN 1 ELSE 0 END AS qualif_a_preencher,

    -- Risco status
    CASE WHEN has_ciclo_fisico AND fase_risco_preenchida THEN 1 ELSE 0 END AS risco_preenchido,
    CASE WHEN has_ciclo_fisico AND NOT fase_risco_preenchida THEN 1 ELSE 0 END AS risco_a_preencher,

    -- Fechamento status
    CASE WHEN has_ciclo_fisico AND fase_fechamento_preenchida THEN 1 ELSE 0 END AS fechadas,
    CASE WHEN has_ciclo_fisico AND NOT fase_fechamento_preenchida THEN 1 ELSE 0 END AS a_fechar
FROM
    meta_consolidated;
