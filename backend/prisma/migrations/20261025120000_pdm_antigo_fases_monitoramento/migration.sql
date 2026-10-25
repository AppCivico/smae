-- Fases padrão (mesmas do backfill 20260625133722) para os PDMs antigos, que ficaram de fora.
-- A cópia do conteúdo legado para as fases roda no cron de PsMonitoramentoMigracaoService.
WITH alvo AS (
    SELECT p.id AS pdm_id
    FROM pdm p
    WHERE p.sistema = 'PDM'
      AND p.removido_em IS NULL
      AND NOT EXISTS (SELECT 1 FROM pdm_monitoramento_fase_config f WHERE f.pdm_id = p.id)
),
fases_novas AS (
    INSERT INTO pdm_monitoramento_fase_config
        (pdm_id, ordem, habilitada, rotulo, aceita_tags, aceita_anexos, criado_por, criado_em)
    SELECT a.pdm_id, v.ordem, true, v.rotulo, v.aceita_tags, v.aceita_anexos, -1, now()
    FROM alvo a
    CROSS JOIN (VALUES
        (1::smallint, 'Qualificação',          false, true),
        (2::smallint, 'Análise de risco',      false, false),
        (3::smallint, 'Tags de monitoramento', true,  false),
        (4::smallint, 'Fechamento',            false, false)
    ) AS v(ordem, rotulo, aceita_tags, aceita_anexos)
    RETURNING id, ordem
)
INSERT INTO pdm_monitoramento_bloco_config
    (fase_id, ordem, habilitado, rotulo, criado_por, criado_em)
SELECT f.id, b.ordem, true, b.rotulo, -1, now()
FROM fases_novas f
JOIN (VALUES
    (1::smallint, 1::smallint, 'Informações complementares'),
    (2::smallint, 1::smallint, 'Detalhamento'),
    (2::smallint, 2::smallint, 'Ponto de atenção'),
    (4::smallint, 1::smallint, 'Comentário')
) AS b(fase_ordem, ordem, rotulo) ON b.fase_ordem = f.ordem;
