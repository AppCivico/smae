-- Reparo manual (rodar uma vez) dos caches de Projetos/Obras corrigidos no PR #667.
-- Rodar DEPOIS de `prisma migrate deploy` e do runner de manual-copy (funções novas já aplicadas):
--   psql -v ON_ERROR_STOP=1 -f backend/prisma/reparos/20260929-projetos.sql "$DATABASE_URL"
-- Idempotente: só escreve onde o valor calculado difere do gravado.
-- Sem reparo (leitura apenas): filtros removido_em em TS, índices de tarefa_dependente e views Metabase de custo (recriadas por migration).

BEGIN;

-- 36df4d652: contadores n_dep_* ignoravam predecessoras removidas (mesma regra de atualiza_tarefa_n_dep)
UPDATE tarefa t
SET
    n_dep_inicio_planejado = cc.n_inicio,
    n_dep_termino_planejado = cc.n_termino
FROM (
    SELECT
        t2.id AS tarefa_id,
        COALESCE(SUM(CASE WHEN td.tipo IN ('termina_pro_inicio', 'inicia_pro_inicio') THEN 1 ELSE 0 END), 0) AS n_inicio,
        COALESCE(SUM(CASE WHEN td.tipo IN ('termina_pro_termino', 'inicia_pro_termino') THEN 1 ELSE 0 END), 0) AS n_termino
    FROM tarefa t2
    LEFT JOIN tarefa_dependente td ON td.tarefa_id = t2.id
        AND EXISTS (
            SELECT 1 FROM tarefa pred
            WHERE pred.id = td.dependencia_tarefa_id AND pred.removido_em IS NULL
        )
    WHERE t2.removido_em IS NULL
    GROUP BY t2.id
) cc
WHERE t.id = cc.tarefa_id
  AND (t.n_dep_inicio_planejado != cc.n_inicio OR t.n_dep_termino_planejado != cc.n_termino);

-- 36df4d652: calendário do tarefa_cronograma não recalculava ao mover tarefa entre raiz e filha
SELECT atualiza_calendario_tarefa_cronograma(tc.id)
FROM tarefa_cronograma tc
WHERE tc.removido_em IS NULL;

-- e8925c820: projeto.ano_orcamento não encolhia ao remover tarefa (roda depois do calendário, que já pode ter recalculado)
SELECT atualiza_ano_orcamento_projeto(p.id)
FROM projeto p
WHERE p.removido_em IS NULL;

-- e8925c820: rollups por portfolio ignoravam remoção/restauração de projeto (planejado, mesma regra de f_tgr_update_soma_dotacao)
UPDATE portfolio_dotacao_planejado pdp
SET
    soma_valor_planejado = s.soma,
    pressao_orcamentaria = s.pressao
FROM (
    SELECT
        x.id,
        COALESCE(SUM(op.valor_planejado) FILTER (WHERE op.removido_em IS NULL AND p.removido_em IS NULL), 0) AS soma,
        COALESCE(
            COALESCE(SUM(op.valor_planejado) FILTER (WHERE op.removido_em IS NULL AND p.removido_em IS NULL), 0) > dp.val_orcado_atualizado,
            false
        ) AS pressao
    FROM portfolio_dotacao_planejado x
    JOIN dotacao_planejado dp ON dp.ano_referencia = x.ano_referencia AND dp.dotacao = x.dotacao
    LEFT JOIN projeto p ON p.portfolio_id = x.portfolio_id
    LEFT JOIN orcamento_planejado op ON op.projeto_id = p.id
        AND op.ano_referencia = x.ano_referencia
        AND op.dotacao = x.dotacao
    GROUP BY x.id, dp.val_orcado_atualizado
) s
WHERE pdp.id = s.id
  AND (pdp.soma_valor_planejado IS DISTINCT FROM s.soma OR pdp.pressao_orcamentaria IS DISTINCT FROM s.pressao);

-- e8925c820: rollup realizado por dotação, sem processo
UPDATE portfolio_dotacao_realizado r
SET
    soma_valor_empenho = s.empenho,
    soma_valor_liquidado = s.liquidado
FROM (
    SELECT
        x.id,
        COALESCE(SUM(o.soma_valor_empenho) FILTER (WHERE o.removido_em IS NULL AND p.removido_em IS NULL), 0) AS empenho,
        COALESCE(SUM(o.soma_valor_liquidado) FILTER (WHERE o.removido_em IS NULL AND p.removido_em IS NULL), 0) AS liquidado
    FROM portfolio_dotacao_realizado x
    LEFT JOIN projeto p ON p.portfolio_id = x.portfolio_id
    LEFT JOIN orcamento_realizado o ON o.projeto_id = p.id
        AND o.ano_referencia = x.ano_referencia
        AND o.dotacao = x.dotacao
        AND o.processo IS NULL
    GROUP BY x.id
) s
WHERE r.id = s.id
  AND (r.soma_valor_empenho IS DISTINCT FROM s.empenho OR r.soma_valor_liquidado IS DISTINCT FROM s.liquidado);

-- e8925c820: rollup realizado por dotação e processo (sem nota de empenho)
UPDATE portfolio_dotacao_processo r
SET
    soma_valor_empenho = s.empenho,
    soma_valor_liquidado = s.liquidado
FROM (
    SELECT
        x.id,
        COALESCE(SUM(o.soma_valor_empenho) FILTER (WHERE o.removido_em IS NULL AND p.removido_em IS NULL), 0) AS empenho,
        COALESCE(SUM(o.soma_valor_liquidado) FILTER (WHERE o.removido_em IS NULL AND p.removido_em IS NULL), 0) AS liquidado
    FROM portfolio_dotacao_processo x
    LEFT JOIN projeto p ON p.portfolio_id = x.portfolio_id
    LEFT JOIN orcamento_realizado o ON o.projeto_id = p.id
        AND o.ano_referencia = x.ano_referencia
        AND o.dotacao = x.dotacao
        AND o.processo = x.dotacao_processo
        AND o.nota_empenho IS NULL
    GROUP BY x.id
) s
WHERE r.id = s.id
  AND (r.soma_valor_empenho IS DISTINCT FROM s.empenho OR r.soma_valor_liquidado IS DISTINCT FROM s.liquidado);

-- e8925c820: rollup realizado por dotação, processo e nota de empenho
UPDATE portfolio_dotacao_processo_nota r
SET
    soma_valor_empenho = s.empenho,
    soma_valor_liquidado = s.liquidado
FROM (
    SELECT
        x.id,
        COALESCE(SUM(o.soma_valor_empenho) FILTER (WHERE o.removido_em IS NULL AND p.removido_em IS NULL), 0) AS empenho,
        COALESCE(SUM(o.soma_valor_liquidado) FILTER (WHERE o.removido_em IS NULL AND p.removido_em IS NULL), 0) AS liquidado
    FROM portfolio_dotacao_processo_nota x
    LEFT JOIN projeto p ON p.portfolio_id = x.portfolio_id
    LEFT JOIN orcamento_realizado o ON o.projeto_id = p.id
        AND o.ano_referencia = x.ano_referencia
        AND o.dotacao = x.dotacao
        AND o.processo = x.dotacao_processo
        AND o.nota_empenho = x.dotacao_processo_nota
    GROUP BY x.id
) s
WHERE r.id = s.id
  AND (r.soma_valor_empenho IS DISTINCT FROM s.empenho OR r.soma_valor_liquidado IS DISTINCT FROM s.liquidado);

COMMIT;
