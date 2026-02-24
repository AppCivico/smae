-- Backfill referencia_mes pra quem ja tava criado antes de 2024/oct
-- O código antigo do cron definia referencia_mes como o mês atual no momento da execução,
-- o que corresponde a EXTRACT(MONTH FROM criado_em).
UPDATE pdm_orcamento_realizado_controle_concluido
SET referencia_mes = EXTRACT(MONTH FROM criado_em)::SMALLINT
WHERE referencia_mes IS NULL;
