CREATE OR REPLACE VIEW ps_dashboard_meta_stats AS
SELECT
pdm_id,
item_id,
tipo,

-- Basic metadata
meta_id AS meta_id,
equipes,
equipes_orgaos,

-- Com/sem pendência
CASE WHEN pendente = true THEN 1 ELSE 0 END AS pendente,

-- Variáveis status
CASE WHEN variaveis_total > 0 AND variaveis_liberadas = variaveis_total THEN 1 ELSE 0 END AS var_liberadas,
CASE WHEN variaveis_total > 0 AND variaveis_liberadas < variaveis_total THEN 1 ELSE 0 END AS var_a_liberar,

-- Cronograma status
CASE WHEN cronograma_total > 0 AND cronograma_atraso_inicio = 0 AND cronograma_atraso_fim = 0
    THEN 1 ELSE 0 END AS crono_preenchido,
CASE WHEN cronograma_total > 0 AND (cronograma_atraso_inicio > 0 OR cronograma_atraso_fim > 0)
    THEN 1 ELSE 0 END AS crono_a_preencher,

-- Orçamento status
CASE WHEN orcamento_total > 0 AND orcamento_preenchido = orcamento_total THEN 1 ELSE 0 END AS orc_preenchido,
CASE WHEN orcamento_total > 0 AND orcamento_preenchido = orcamento_total THEN 1 ELSE 0 END AS orc_a_preencher,

-- Qualificação (fase_analise) status
CASE WHEN ciclo_fisico_id IS NOT NULL AND fase_analise_preenchida = true THEN 1 ELSE 0 END AS qualif_preenchida,
CASE WHEN ciclo_fisico_id IS NOT NULL AND fase_analise_preenchida = false THEN 1 ELSE 0 END AS qualif_a_preencher,

-- Risco status
CASE WHEN ciclo_fisico_id IS NOT NULL AND fase_risco_preenchida = true THEN 1 ELSE 0 END AS risco_preenchido,
CASE WHEN ciclo_fisico_id IS NOT NULL AND fase_risco_preenchida = false THEN 1 ELSE 0 END AS risco_a_preencher,

-- Fechamento status
CASE WHEN ciclo_fisico_id IS NOT NULL AND fase_fechamento_preenchida = true THEN 1 ELSE 0 END AS fechadas,
CASE WHEN ciclo_fisico_id IS NOT NULL AND fase_fechamento_preenchida = false THEN 1 ELSE 0 END AS a_fechar
FROM
ps_dashboard_consolidado;
