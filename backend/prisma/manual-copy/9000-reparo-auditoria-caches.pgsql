-- Reparo de dados da auditoria de caches (PRs #665 core, #667 projetos, #668 casa civil, #666 PDM/PS).
-- Fica em manual-copy e não em prisma/migrations porque chama as funções e triggers novos destes PRs, que só existem
-- depois do runner de manual-copy (o 9000 roda depois de todos os arquivos numerados). O runner executa o arquivo numa
-- transação só e reexecuta quando o hash muda; tudo aqui é idempotente.
-- Diagnósticos ficam em reparo.diagnostico (schema fora do Prisma, não gera drift).
-- Passo fora do SQL, depois do deploy: PATCH /api/pessoa/recalc-equipe (SMAE.superadmin), recalcula perfis_equipe_pdm/ps.

CREATE SCHEMA IF NOT EXISTS reparo;
CREATE TABLE IF NOT EXISTS reparo.diagnostico (
    id serial PRIMARY KEY,
    executado_em timestamptz NOT NULL DEFAULT now(),
    secao text NOT NULL,
    dados jsonb NOT NULL
);

-- ============================================================================
-- A. Core (#665): perfil_acesso.modulos_sistemas
-- ============================================================================

-- mesma lógica da update_modulos_sistemas() (0065), só para perfis com ao menos 1 perfil_privilegio
WITH calc AS (
    SELECT
        pp.perfil_acesso_id,
        ARRAY_AGG(DISTINCT ms ORDER BY ms) AS modulos
    FROM perfil_privilegio pp
    JOIN privilegio p ON p.id = pp.privilegio_id
    JOIN privilegio_modulo pm ON pm.id = p.modulo_id
    CROSS JOIN LATERAL unnest(pm.modulo_sistema) AS ms
    GROUP BY pp.perfil_acesso_id
),
alvo AS (
    SELECT
        pa.id,
        COALESCE(c.modulos, '{}'::"ModuloSistema"[]) AS modulos
    FROM perfil_acesso pa
    LEFT JOIN calc c ON c.perfil_acesso_id = pa.id
    WHERE EXISTS (SELECT 1 FROM perfil_privilegio x WHERE x.perfil_acesso_id = pa.id)
)
UPDATE perfil_acesso pa
SET modulos_sistemas = alvo.modulos
FROM alvo
WHERE pa.id = alvo.id
AND pa.modulos_sistemas IS DISTINCT FROM alvo.modulos;

-- o trigger não dispara sem perfil_privilegio; valor diferente de {} aqui precisa de avaliação manual
INSERT INTO reparo.diagnostico (secao, dados)
SELECT 'core.perfil_sem_privilegio', jsonb_build_object('id', pa.id, 'nome', pa.nome, 'modulos_sistemas', pa.modulos_sistemas, 'removido_em', pa.removido_em)
FROM perfil_acesso pa
WHERE NOT EXISTS (SELECT 1 FROM perfil_privilegio x WHERE x.perfil_acesso_id = pa.id)
AND pa.modulos_sistemas <> '{}'::"ModuloSistema"[];

-- ============================================================================
-- B. Projetos/Obras (#667)
-- ============================================================================

-- n_dep_* ignoravam predecessoras removidas (mesma regra de atualiza_tarefa_n_dep)
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

-- calendário do tarefa_cronograma não recalculava ao mover tarefa entre raiz e filha
SELECT atualiza_calendario_tarefa_cronograma(tc.id)
FROM tarefa_cronograma tc
WHERE tc.removido_em IS NULL;

-- projeto.ano_orcamento não encolhia ao remover tarefa (depois do calendário, que já pode ter recalculado)
SELECT atualiza_ano_orcamento_projeto(p.id)
FROM projeto p
WHERE p.removido_em IS NULL;

-- rollups por portfolio ignoravam remoção/restauração de projeto (mesma regra de f_tgr_update_soma_dotacao)
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

-- tarefa.numero fora de 1..N entre irmãs (clone concorrente duplicava o cronograma); qtd = 2 * distintos indica cópia em dobro
INSERT INTO reparo.diagnostico (secao, dados)
SELECT 'projetos.tarefa_numero_quebrado', jsonb_build_object(
    'tipo', CASE WHEN tc.projeto_id IS NOT NULL THEN 'projeto' WHEN tc.transferencia_id IS NOT NULL THEN 'transferencia' ELSE 'outro' END,
    'projeto_id', tc.projeto_id, 'transferencia_id', tc.transferencia_id,
    'tarefa_cronograma_id', t.tarefa_cronograma_id, 'tarefa_pai_id', t.tarefa_pai_id,
    'qtd', count(*), 'min', min(t.numero), 'max', max(t.numero), 'distintos', count(DISTINCT t.numero))
FROM tarefa t
JOIN tarefa_cronograma tc ON tc.id = t.tarefa_cronograma_id
WHERE t.removido_em IS NULL
GROUP BY tc.projeto_id, tc.transferencia_id, t.tarefa_cronograma_id, t.tarefa_pai_id
HAVING min(t.numero) <> 1 OR max(t.numero) <> count(*) OR count(DISTINCT t.numero) <> count(*);

-- renumera para 1..N mantendo a ordem (mesma regra do TarefaUtilsService.normalizaNumero); transferência só no diagnóstico
WITH ordenado AS (
    SELECT t.id,
        (ROW_NUMBER() OVER (PARTITION BY t.tarefa_cronograma_id, t.tarefa_pai_id ORDER BY t.numero, t.criado_em, t.id))::int AS numero_correto
    FROM tarefa t
    JOIN tarefa_cronograma tc ON tc.id = t.tarefa_cronograma_id
    WHERE t.removido_em IS NULL
      AND tc.projeto_id IS NOT NULL
)
UPDATE tarefa t
SET numero = o.numero_correto
FROM ordenado o
WHERE t.id = o.id
  AND t.numero IS DISTINCT FROM o.numero_correto;

-- ============================================================================
-- C. Casa Civil (#668)
-- ============================================================================

-- triggers antigos nunca disparavam em bancos existentes
SELECT atualiza_transferencia_status_consolidado(t.id)
FROM transferencia t
ORDER BY t.id;

-- vetores_busca NULL faz o trigger BEFORE UPDATE recalcular (partido renomeado)
UPDATE parlamentar p
SET vetores_busca = NULL
WHERE EXISTS (
    SELECT 1 FROM parlamentar_mandato pm
    WHERE pm.parlamentar_id = p.id AND pm.removido_em IS NULL AND pm.partido_candidatura_id IS NOT NULL
);

-- órgão, tipo, partido, parlamentar, distribuição removida
UPDATE transferencia
SET vetores_busca = f_rebuild_transferencia_tsvector(id)
WHERE removido_em IS NULL
  AND vetores_busca IS DISTINCT FROM f_rebuild_transferencia_tsvector(id);

-- ============================================================================
-- D. PDM legado e Plano Setorial / Programa de Metas (#666)
-- ============================================================================

-- D.0 Variáveis removidas junto com o indicador pelo IndicadorService.remove antigo, que apagava toda variável com
-- QUALQUER vínculo ao indicador, inclusive as herdadas. Só a variável PDM com vínculo próprio foi removida de propósito.
CREATE TEMP TABLE tmp_vitimas_indicador (
    variavel_id int,
    tipo text,
    codigo text,
    titulo text,
    indicador_id int,
    indicador_origem_id int,
    indicador_removido_em timestamptz,
    variavel_removido_em timestamptz
) ON COMMIT DROP;

INSERT INTO tmp_vitimas_indicador
SELECT DISTINCT v.id, v.tipo::text, v.codigo, v.titulo, i.id, iv.indicador_origem_id, i.removido_em, v.removido_em
FROM variavel v
JOIN indicador_variavel iv ON iv.variavel_id = v.id
JOIN indicador i ON i.id = iv.indicador_id AND i.removido_em IS NOT NULL
WHERE v.removido_em IS NOT NULL
  AND v.removido_por IS NOT DISTINCT FROM i.removido_por
  AND abs(extract(epoch FROM (v.removido_em - i.removido_em))) <= 5
  AND (
      v.tipo IN ('Global', 'Composta') -- Composta é o valor no banco de Calculada
      -- vínculo herdado: a variável é de outro indicador; vítima se nenhum indicador próprio dela foi removido
      OR (
          iv.indicador_origem_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1
              FROM indicador_variavel own
              JOIN indicador oi ON oi.id = own.indicador_id
              WHERE own.variavel_id = v.id
                AND own.indicador_origem_id IS NULL
                AND oi.removido_em IS NOT NULL
          )
      )
  );

-- D.1 Filhas e calculadas órfãs de mãe removida
CREATE TEMP TABLE tmp_orfas_variavel (
    variavel_id int,
    mae_id int,
    tipo_orfa text,
    mae_removido_em timestamptz,
    mae_removido_por int
) ON COMMIT DROP;
CREATE TEMP TABLE tmp_orfas_formula (
    formula_id int,
    mae_id int,
    variavel_calc_id int,
    mae_removido_em timestamptz,
    mae_removido_por int
) ON COMMIT DROP;
CREATE TEMP TABLE tmp_orfas_puladas (
    variavel_id int,
    mae_id int,
    tipo_orfa text
) ON COMMIT DROP;

-- mães possivelmente vítimas do D.0 ficam de fora: se forem restauradas, as filhas devem continuar ativas
INSERT INTO tmp_orfas_variavel
SELECT f.id, m.id, 'filha', m.removido_em, m.removido_por
FROM variavel m
JOIN variavel f ON f.variavel_mae_id = m.id AND f.removido_em IS NULL
WHERE m.removido_em IS NOT NULL
  AND m.id NOT IN (SELECT variavel_id FROM tmp_vitimas_indicador);

INSERT INTO tmp_orfas_formula
SELECT fc.id, m.id, fc.variavel_calc_id, m.removido_em, m.removido_por
FROM variavel m
JOIN formula_composta fc ON fc.variavel_mae_id = m.id AND fc.autogerenciavel AND fc.removido_em IS NULL
WHERE m.removido_em IS NOT NULL
  AND m.id NOT IN (SELECT variavel_id FROM tmp_vitimas_indicador);

INSERT INTO tmp_orfas_variavel
SELECT c.id, o.mae_id, 'calculada', o.mae_removido_em, o.mae_removido_por
FROM tmp_orfas_formula o
JOIN variavel c ON c.id = o.variavel_calc_id AND c.removido_em IS NULL;

-- ainda ligada a indicador ativo (mesma regra do VariavelService.buscaVariaveisComIndicadorAtivo): pula
WITH em_uso AS (
    SELECT DISTINCT iv.variavel_id
    FROM indicador_variavel iv
    JOIN indicador i ON i.id = iv.indicador_id AND i.removido_em IS NULL
    LEFT JOIN meta m1 ON m1.id = i.meta_id
    LEFT JOIN iniciativa in2 ON in2.id = i.iniciativa_id
    LEFT JOIN meta m2 ON m2.id = in2.meta_id
    LEFT JOIN atividade a3 ON a3.id = i.atividade_id
    LEFT JOIN iniciativa in3 ON in3.id = a3.iniciativa_id
    LEFT JOIN meta m3 ON m3.id = in3.meta_id
    JOIN pdm p ON p.id = COALESCE(m1.pdm_id, m2.pdm_id, m3.pdm_id) AND p.removido_em IS NULL
    WHERE iv.desativado = false
      AND iv.variavel_id IN (SELECT variavel_id FROM tmp_orfas_variavel)
      AND (
          (m1.id IS NOT NULL AND m1.removido_em IS NULL)
          OR (in2.id IS NOT NULL AND in2.removido_em IS NULL AND m2.removido_em IS NULL)
          OR (a3.id IS NOT NULL AND a3.removido_em IS NULL AND in3.removido_em IS NULL AND m3.removido_em IS NULL)
      )
),
puladas AS (
    DELETE FROM tmp_orfas_variavel o
    USING em_uso u
    WHERE o.variavel_id = u.variavel_id
    RETURNING o.variavel_id, o.mae_id, o.tipo_orfa
)
INSERT INTO tmp_orfas_puladas SELECT * FROM puladas;

DELETE FROM tmp_orfas_formula f
WHERE f.variavel_calc_id IN (SELECT variavel_id FROM tmp_orfas_puladas);

INSERT INTO reparo.diagnostico (secao, dados)
SELECT 'pdm_ps.orfa_pulada_em_uso_por_indicador',
    jsonb_build_object('variavel_id', v.id, 'tipo', v.tipo, 'codigo', v.codigo, 'titulo', v.titulo, 'mae_id', p.mae_id, 'tipo_orfa', p.tipo_orfa)
FROM tmp_orfas_puladas p
JOIN variavel v ON v.id = p.variavel_id;

INSERT INTO reparo.diagnostico (secao, dados)
SELECT 'pdm_ps.orfa_removida',
    jsonb_build_object('variavel_id', o.variavel_id, 'mae_id', o.mae_id, 'tipo_orfa', o.tipo_orfa)
FROM tmp_orfas_variavel o;

UPDATE variavel v
SET removido_em = o.mae_removido_em, removido_por = o.mae_removido_por
FROM tmp_orfas_variavel o
WHERE v.id = o.variavel_id
  AND v.removido_em IS NULL;

UPDATE variavel_grupo_responsavel_equipe e
SET removido_em = o.mae_removido_em
FROM tmp_orfas_variavel o
WHERE e.variavel_id = o.variavel_id
  AND e.removido_em IS NULL;

UPDATE formula_composta fc
SET removido_em = o.mae_removido_em, removido_por = o.mae_removido_por
FROM tmp_orfas_formula o
WHERE fc.id = o.formula_id
  AND fc.removido_em IS NULL;

DELETE FROM indicador_formula_composta
WHERE formula_composta_id IN (SELECT formula_id FROM tmp_orfas_formula);

DELETE FROM indicador_variavel
WHERE variavel_id IN (SELECT variavel_id FROM tmp_orfas_variavel)
   OR variavel_id IN (SELECT mae_id FROM tmp_orfas_variavel);

-- órfã usada em fórmula de indicador ou em outra composta: o vínculo é removido (a fórmula deve usar a mãe)
WITH apagados AS (
    DELETE FROM indicador_formula_variavel ifv
    USING tmp_orfas_variavel o
    WHERE ifv.variavel_id = o.variavel_id
    RETURNING ifv.*
)
INSERT INTO reparo.diagnostico (secao, dados)
SELECT 'pdm_ps.orfa_vinculo_formula_indicador_removido', to_jsonb(a) || jsonb_build_object('indicador_formula', i.formula)
FROM apagados a
JOIN indicador i ON i.id = a.indicador_id;

WITH apagados AS (
    DELETE FROM formula_composta_variavel fcv
    USING tmp_orfas_variavel o, formula_composta fc
    WHERE fcv.variavel_id = o.variavel_id
      AND fc.id = fcv.formula_composta_id
      AND fc.removido_em IS NULL
    RETURNING fcv.*
)
INSERT INTO reparo.diagnostico (secao, dados)
SELECT 'pdm_ps.orfa_vinculo_formula_composta_removido', to_jsonb(a) || jsonb_build_object('formula_composta_titulo', fc.titulo, 'formula', fc.formula)
FROM apagados a
JOIN formula_composta fc ON fc.id = a.formula_composta_id;

-- séries e dashboard PS (recalc_vars_ps_dashboard remove a linha da família removida)
SELECT refresh_variavel(x.id, NULL)
FROM (
    SELECT variavel_id AS id FROM tmp_orfas_variavel
    UNION
    SELECT mae_id FROM tmp_orfas_variavel
) x
WHERE NOT EXISTS (
    SELECT 1 FROM task_queue t
    WHERE t.type = 'refresh_variavel' AND t.status = 'pending' AND (t.params->>'variavel_id')::int = x.id
);

-- D.2 Só lista as possíveis vítimas do D.0; a restauração é caso a caso (UPDATE variavel SET removido_em = NULL,
-- removido_por = NULL + refresh_variavel). Equipes e indicador_variavel não voltam sozinhos.
INSERT INTO reparo.diagnostico (secao, dados)
SELECT 'pdm_ps.possivel_vitima_remocao_indicador', to_jsonb(t)
FROM tmp_vitimas_indicador t;

-- D.3 Cache de acesso e status de meta do PDM legado (recalculados sob demanda no próximo acesso)
DELETE FROM pessoa_acesso_pdm_valido;
DELETE FROM pessoa_acesso_pdm;
DELETE FROM status_meta_ciclo_fisico;

-- D.4 Cronograma e etapas: percentual_execucao das etapas pai (folhas para a raiz), do cronograma e datas
DO $$
DECLARE
    c RECORD;
    r RECORD;
BEGIN
    FOR c IN
        SELECT cr.id FROM cronograma cr WHERE cr.removido_em IS NULL ORDER BY cr.id
    LOOP
        FOR r IN
            WITH RECURSIVE arvore AS (
                SELECT id, etapa_pai_id, 0 AS profundidade
                FROM etapa
                WHERE etapa_pai_id IS NULL AND removido_em IS NULL AND cronograma_id = c.id
                UNION ALL
                SELECT e.id, e.etapa_pai_id, a.profundidade + 1
                FROM etapa e
                JOIN arvore a ON a.id = e.etapa_pai_id
                WHERE e.removido_em IS NULL
            )
            SELECT a.id
            FROM arvore a
            WHERE EXISTS (SELECT 1 FROM etapa f WHERE f.etapa_pai_id = a.id)
            ORDER BY a.profundidade DESC, a.id
        LOOP
            PERFORM calculate_percentual_execucao_for_id(r.id);
        END LOOP;

        IF EXISTS (SELECT 1 FROM etapa e WHERE e.cronograma_id = c.id AND e.removido_em IS NULL) THEN
            PERFORM calculate_percentual_execucao_for_id(c.id, true);
        END IF;

        PERFORM atualiza_inicio_fim_cronograma(c.id);
    END LOOP;
END $$;

-- D.5 Ciclo corrente: linhas de variáveis removidas ou que deixaram de ser Global mãe
DELETE FROM variavel_ciclo_corrente c
WHERE NOT EXISTS (
    SELECT 1 FROM variavel v
    WHERE v.id = c.variavel_id AND v.tipo = 'Global' AND v.variavel_mae_id IS NULL AND v.removido_em IS NULL
);

SELECT f_atualiza_todas_variaveis();

-- D.6
REFRESH MATERIALIZED VIEW mv_variavel_pdm;

-- D.7 Dashboard PS por variável: famílias sem nenhuma variável ativa
DELETE FROM ps_dashboard_variavel d
WHERE NOT EXISTS (
    SELECT 1 FROM variavel a
    WHERE COALESCE(a.variavel_mae_id, a.id) = d.variavel_id AND a.removido_em IS NULL
);

-- recalculando que nunca voltou para false (refresh_variavel antigo), sem tarefa pendente ou rodando
UPDATE variavel v
SET recalculando = false
WHERE v.recalculando
  AND v.recalculo_erro IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM task_queue t
      WHERE t.type = 'refresh_variavel' AND t.status IN ('pending', 'running')
        AND (t.params->>'variavel_id')::int = v.id
  );

-- reenfileira as variáveis Global dos planos setoriais, como AddTaskRecalcVariaveis({ pdmId })
SELECT refresh_variavel(x.id, NULL)
FROM (
    SELECT DISTINCT v.id
    FROM variavel v
    JOIN indicador_variavel iv ON iv.variavel_id = v.id
    JOIN indicador i ON i.id = iv.indicador_id AND i.removido_em IS NULL
    JOIN view_metas_arvore_pdm a ON (a.tipo = 'meta' AND i.meta_id = a.id)
        OR (a.tipo = 'iniciativa' AND i.iniciativa_id = a.id)
        OR (a.tipo = 'atividade' AND i.atividade_id = a.id)
    JOIN pdm p ON p.id = a.pdm_id AND p.removido_em IS NULL AND p.sistema <> 'PDM'
    WHERE v.removido_em IS NULL AND v.tipo = 'Global'
) x
WHERE NOT EXISTS (
    SELECT 1 FROM task_queue t
    WHERE t.type = 'refresh_variavel' AND t.status = 'pending' AND (t.params->>'variavel_id')::int = x.id
);

-- D.8 Somas de dotação do PDM: recálculo direto pela regra dos triggers f_tgr_update_soma_dotacao*. Cobre também
-- orçamento já removido que ainda somava, e chave sem dotacao_planejado (onde o trigger de planejado nunca dispara).
WITH s AS (
    SELECT m.pdm_id, op.ano_referencia, op.dotacao,
        SUM(op.valor_planejado) FILTER (WHERE op.removido_em IS NULL AND m.removido_em IS NULL AND i.removido_em IS NULL AND a.removido_em IS NULL) AS soma
    FROM orcamento_planejado op
    JOIN meta m ON m.id = op.meta_id
    LEFT JOIN iniciativa i ON i.id = op.iniciativa_id
    LEFT JOIN atividade a ON a.id = op.atividade_id
    GROUP BY 1, 2, 3
), calc AS (
    SELECT x.id,
        COALESCE(s.soma, 0) AS soma,
        COALESCE(COALESCE(s.soma, 0) > dp.val_orcado_atualizado, x.pressao_orcamentaria) AS pressao
    FROM pdm_dotacao_planejado x
    LEFT JOIN s ON s.pdm_id = x.pdm_id AND s.ano_referencia = x.ano_referencia AND s.dotacao = x.dotacao
    LEFT JOIN dotacao_planejado dp ON dp.ano_referencia = x.ano_referencia AND dp.dotacao = x.dotacao
)
UPDATE pdm_dotacao_planejado x
SET soma_valor_planejado = c.soma, pressao_orcamentaria = c.pressao
FROM calc c
WHERE x.id = c.id
  AND (x.soma_valor_planejado IS DISTINCT FROM c.soma OR x.pressao_orcamentaria IS DISTINCT FROM c.pressao);

CREATE TEMP TABLE tmp_realizado_pdm ON COMMIT DROP AS
SELECT m.pdm_id, o.ano_referencia, o.dotacao, o.processo, o.nota_empenho,
    SUM(o.soma_valor_empenho) FILTER (WHERE o.removido_em IS NULL AND m.removido_em IS NULL AND i.removido_em IS NULL AND a.removido_em IS NULL) AS empenho,
    SUM(o.soma_valor_liquidado) FILTER (WHERE o.removido_em IS NULL AND m.removido_em IS NULL AND i.removido_em IS NULL AND a.removido_em IS NULL) AS liquidado
FROM orcamento_realizado o
JOIN meta m ON m.id = o.meta_id
LEFT JOIN iniciativa i ON i.id = o.iniciativa_id
LEFT JOIN atividade a ON a.id = o.atividade_id
GROUP BY 1, 2, 3, 4, 5;

UPDATE pdm_dotacao_realizado x
SET soma_valor_empenho = c.empenho, soma_valor_liquidado = c.liquidado
FROM (
    SELECT x.id, COALESCE(SUM(t.empenho), 0) AS empenho, COALESCE(SUM(t.liquidado), 0) AS liquidado
    FROM pdm_dotacao_realizado x
    LEFT JOIN tmp_realizado_pdm t ON t.pdm_id = x.pdm_id AND t.ano_referencia = x.ano_referencia AND t.dotacao = x.dotacao
        AND t.processo IS NULL
    GROUP BY x.id
) c
WHERE x.id = c.id
  AND (x.soma_valor_empenho IS DISTINCT FROM c.empenho OR x.soma_valor_liquidado IS DISTINCT FROM c.liquidado);

UPDATE pdm_dotacao_processo x
SET soma_valor_empenho = c.empenho, soma_valor_liquidado = c.liquidado
FROM (
    SELECT x.id, COALESCE(SUM(t.empenho), 0) AS empenho, COALESCE(SUM(t.liquidado), 0) AS liquidado
    FROM pdm_dotacao_processo x
    LEFT JOIN tmp_realizado_pdm t ON t.pdm_id = x.pdm_id AND t.ano_referencia = x.ano_referencia AND t.dotacao = x.dotacao
        AND t.processo = x.dotacao_processo AND t.nota_empenho IS NULL
    GROUP BY x.id
) c
WHERE x.id = c.id
  AND (x.soma_valor_empenho IS DISTINCT FROM c.empenho OR x.soma_valor_liquidado IS DISTINCT FROM c.liquidado);

UPDATE pdm_dotacao_processo_nota x
SET soma_valor_empenho = c.empenho, soma_valor_liquidado = c.liquidado
FROM (
    SELECT x.id, COALESCE(SUM(t.empenho), 0) AS empenho, COALESCE(SUM(t.liquidado), 0) AS liquidado
    FROM pdm_dotacao_processo_nota x
    LEFT JOIN tmp_realizado_pdm t ON t.pdm_id = x.pdm_id AND t.ano_referencia = x.ano_referencia AND t.dotacao = x.dotacao
        AND t.processo = x.dotacao_processo AND t.nota_empenho = x.dotacao_processo_nota
    GROUP BY x.id
) c
WHERE x.id = c.id
  AND (x.soma_valor_empenho IS DISTINCT FROM c.empenho OR x.soma_valor_liquidado IS DISTINCT FROM c.liquidado);

-- D.9 Consolidados de meta, processados pelo worker da API depois do startup
INSERT INTO task_queue ("type", params)
SELECT 'refresh_meta'::task_type, jsonb_build_object('meta_id', m.id, 'current_txid', txid_current())
FROM meta m
JOIN pdm p ON p.id = m.pdm_id AND p.removido_em IS NULL
WHERE m.removido_em IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM task_queue t
      WHERE t.type = 'refresh_meta' AND t.status = 'pending' AND (t.params->>'meta_id')::int = m.id
  );

INSERT INTO task_queue ("type", params)
SELECT 'refresh_meta_orcamento_consolidado'::task_type, jsonb_build_object('meta_id', m.id, 'current_txid', txid_current())
FROM meta m
JOIN pdm p ON p.id = m.pdm_id AND p.removido_em IS NULL
WHERE m.removido_em IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM task_queue t
      WHERE t.type = 'refresh_meta_orcamento_consolidado' AND t.status = 'pending' AND (t.params->>'meta_id')::int = m.id
  );

INSERT INTO reparo.diagnostico (secao, dados)
SELECT 'resumo', jsonb_build_object(
    'orfas_removidas', (SELECT count(*) FROM tmp_orfas_variavel),
    'orfas_puladas', (SELECT count(*) FROM tmp_orfas_puladas),
    'possiveis_vitimas', (SELECT count(DISTINCT variavel_id) FROM tmp_vitimas_indicador)
);
