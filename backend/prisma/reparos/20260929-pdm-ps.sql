-- Reparo de dados da branch fix/invalidacao-cache-pdm-ps (PR #666): PDM legado e Plano Setorial / Programa de Metas.
-- As correções só evitam dados obsoletos NOVOS; este script refaz o que os bancos existentes já guardam errado.
--
-- Rodar UMA vez por ambiente (é idempotente, rodar de novo é seguro), com: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 20260929-pdm-ps.sql
-- Ordem: 1) prisma migrate deploy  2) runner dos manual-copy/*.pgsql (funções e triggers novos)  3) este script
--        4) PATCH /api/pessoa/recalc-equipe (SMAE.superadmin), depois que o script terminar (ver final do arquivo).
-- As tarefas enfileiradas (refresh_meta, refresh_meta_orcamento_consolidado, refresh_variavel) são processadas pelo worker da API.

-- tudo ou nada: uma execução parcial deixa filhas removidas com vínculos ativos que o re-run não pega mais
BEGIN;

-- ============================================================================
-- 0. Diagnóstico e candidatos (tabelas temporárias da sessão)
-- ============================================================================

-- 77d6a4e75 (b): variáveis Global/Calculada removidas junto com o indicador pelo IndicadorService.remove antigo
CREATE TEMP TABLE IF NOT EXISTS tmp_vitimas_indicador (
    variavel_id int,
    tipo text,
    codigo text,
    titulo text,
    indicador_id int,
    indicador_removido_em timestamptz,
    variavel_removido_em timestamptz
);
TRUNCATE tmp_vitimas_indicador;

INSERT INTO tmp_vitimas_indicador
SELECT DISTINCT v.id, v.tipo::text, v.codigo, v.titulo, i.id, i.removido_em, v.removido_em
FROM variavel v
JOIN indicador_variavel iv ON iv.variavel_id = v.id AND iv.indicador_origem_id IS NULL
JOIN indicador i ON i.id = iv.indicador_id AND i.removido_em IS NOT NULL
WHERE v.tipo IN ('Global', 'Composta') -- Composta é o valor no banco de Calculada
  AND v.removido_em IS NOT NULL
  AND v.removido_por IS NOT DISTINCT FROM i.removido_por
  AND abs(extract(epoch FROM (v.removido_em - i.removido_em))) <= 5;

-- ============================================================================
-- 1. Variáveis filhas e calculadas órfãs de mãe removida (77d6a4e75, a)
-- ============================================================================

CREATE TEMP TABLE IF NOT EXISTS tmp_orfas_variavel (
    variavel_id int,
    mae_id int,
    tipo_orfa text,
    mae_removido_em timestamptz,
    mae_removido_por int
);
CREATE TEMP TABLE IF NOT EXISTS tmp_orfas_formula (
    formula_id int,
    mae_id int,
    variavel_calc_id int,
    mae_removido_em timestamptz,
    mae_removido_por int
);
CREATE TEMP TABLE IF NOT EXISTS tmp_orfas_puladas (
    variavel_id int,
    mae_id int,
    tipo_orfa text
);
TRUNCATE tmp_orfas_variavel, tmp_orfas_formula, tmp_orfas_puladas;

-- mães possivelmente vítimas do (b) ficam de fora: o operador decide restaurar, e as filhas devem continuar ativas
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

-- filha/calculada ainda ligada a indicador ativo (mesma regra do VariavelService.buscaVariaveisComIndicadorAtivo) é pulada
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

-- filhas e calculadas que NÃO foram tocadas por estarem em uso: revisar manualmente
SELECT 'orfa_pulada_em_uso_por_indicador' AS diagnostico, v.id AS variavel_id, v.tipo, v.codigo, v.titulo, p.mae_id, p.tipo_orfa
FROM tmp_orfas_puladas p
JOIN variavel v ON v.id = p.variavel_id
ORDER BY p.mae_id, v.id;

-- filhas órfãs: soft-delete com a data e o autor da mãe
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

-- vínculos de indicador das removidas (órfãs e suas mães)
DELETE FROM indicador_variavel
WHERE variavel_id IN (SELECT variavel_id FROM tmp_orfas_variavel)
   OR variavel_id IN (SELECT mae_id FROM tmp_orfas_variavel);

-- recalcula séries e dashboard PS (recalc_vars_ps_dashboard remove a linha da família removida)
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

-- ============================================================================
-- 2. Diagnóstico: variáveis Global/Calculada removidas pelo IndicadorService.remove antigo (77d6a4e75, b)
-- ============================================================================

-- só lista, não restaura: o operador confere e, se for o caso, descomenta o UPDATE abaixo e roda o arquivo de novo
SELECT 'possivel_vitima_remocao_indicador' AS diagnostico, t.*
FROM tmp_vitimas_indicador t
ORDER BY t.indicador_id, t.variavel_id;

-- UPDATE variavel v
-- SET removido_em = NULL, removido_por = NULL
-- FROM tmp_vitimas_indicador t
-- WHERE v.id = t.variavel_id
--   AND v.removido_em IS NOT NULL;
--
-- depois de restaurar: SELECT refresh_variavel(variavel_id, NULL) FROM tmp_vitimas_indicador;
-- os vínculos de equipe (variavel_grupo_responsavel_equipe) e o indicador_variavel não são refeitos aqui

-- ============================================================================
-- 3. Cache de acesso e status de meta do PDM legado (c6560b6e2, 00c34432e, b45edb37c)
-- ============================================================================

-- pessoa_acesso_pdm e status_meta_ciclo_fisico são recalculados sob demanda no próximo acesso da pessoa
DELETE FROM pessoa_acesso_pdm_valido;
DELETE FROM pessoa_acesso_pdm;
DELETE FROM status_meta_ciclo_fisico;

-- ============================================================================
-- 4. Cronograma e etapas (39fff7ace)
-- ============================================================================

-- percentual_execucao das etapas pai, das folhas para a raiz, e depois dos cronogramas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        WITH RECURSIVE arvore AS (
            SELECT id, etapa_pai_id, 0 AS profundidade
            FROM etapa
            WHERE etapa_pai_id IS NULL AND removido_em IS NULL
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

    FOR r IN
        SELECT DISTINCT e.cronograma_id AS id
        FROM etapa e
        JOIN cronograma c ON c.id = e.cronograma_id AND c.removido_em IS NULL
        WHERE e.removido_em IS NULL
    LOOP
        PERFORM calculate_percentual_execucao_for_id(r.id, true);
    END LOOP;
END $$;

-- datas de início e fim dos cronogramas (só atualiza quando muda)
SELECT atualiza_inicio_fim_cronograma(c.id)
FROM cronograma c
WHERE c.removido_em IS NULL;

-- ============================================================================
-- 5. Ciclo corrente das variáveis (243cfff25, 7724a7e77: 0010)
-- ============================================================================

-- linhas de variáveis removidas ou que deixaram de ser Global mãe
DELETE FROM variavel_ciclo_corrente c
WHERE NOT EXISTS (
    SELECT 1 FROM variavel v
    WHERE v.id = c.variavel_id AND v.tipo = 'Global' AND v.variavel_mae_id IS NULL AND v.removido_em IS NULL
);

SELECT f_atualiza_todas_variaveis();

-- ============================================================================
-- 6. mv_variavel_pdm (243cfff25: 0023)
-- ============================================================================

REFRESH MATERIALIZED VIEW mv_variavel_pdm;

-- ============================================================================
-- 7. Dashboard PS por variável (243cfff25: 0047, d77baba7f, 7724a7e77)
-- ============================================================================

-- famílias sem nenhuma variável ativa
DELETE FROM ps_dashboard_variavel d
WHERE NOT EXISTS (
    SELECT 1 FROM variavel a
    WHERE COALESCE(a.variavel_mae_id, a.id) = d.variavel_id AND a.removido_em IS NULL
);

-- variável.recalculando que nunca voltou para false (refresh_variavel antigo), sem tarefa pendente ou rodando
UPDATE variavel v
SET recalculando = false
WHERE v.recalculando
  AND v.recalculo_erro IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM task_queue t
      WHERE t.type = 'refresh_variavel' AND t.status IN ('pending', 'running')
        AND (t.params->>'variavel_id')::int = v.id
  );

-- reenfileira o recálculo das variáveis Global dos planos setoriais, como AddTaskRecalcVariaveis({ pdmId })
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

-- ============================================================================
-- 8. Somas de dotação do PDM com iniciativa/atividade removida (e8b106050: 0034, 0066)
-- ============================================================================

-- toca uma linha por chave para os triggers de soma recalcularem pdm_dotacao_planejado
UPDATE dotacao_planejado d
SET id = d.id
WHERE (d.ano_referencia, d.dotacao) IN (
    SELECT op.ano_referencia, op.dotacao
    FROM orcamento_planejado op
    LEFT JOIN iniciativa i ON i.id = op.iniciativa_id
    LEFT JOIN atividade a ON a.id = op.atividade_id
    WHERE op.removido_em IS NULL
      AND (i.removido_em IS NOT NULL OR a.removido_em IS NOT NULL)
);

-- idem para realizado (pdm_dotacao_realizado, _processo e _processo_nota)
UPDATE orcamento_realizado r
SET id = r.id
WHERE r.id IN (
    SELECT DISTINCT ON (o.ano_referencia, o.dotacao, o.processo, o.nota_empenho) o.id
    FROM orcamento_realizado o
    LEFT JOIN iniciativa i ON i.id = o.iniciativa_id
    LEFT JOIN atividade a ON a.id = o.atividade_id
    WHERE o.removido_em IS NULL
      AND (i.removido_em IS NOT NULL OR a.removido_em IS NOT NULL)
    ORDER BY o.ano_referencia, o.dotacao, o.processo, o.nota_empenho, o.id
);

-- ============================================================================
-- 9. Consolidados de meta (00c34432e: 0004/0006, 243cfff25: 0031/0056/0063, 7724a7e77: 0027, 3012c1b95, 39fff7ace)
-- ============================================================================

-- meta_status_consolidado_cf e ps_dashboard_consolidado, via a tarefa que o app já processa
INSERT INTO task_queue ("type", params)
SELECT 'refresh_meta'::task_type, jsonb_build_object('meta_id', m.id, 'current_txid', txid_current())
FROM meta m
JOIN pdm p ON p.id = m.pdm_id AND p.removido_em IS NULL
WHERE m.removido_em IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM task_queue t
      WHERE t.type = 'refresh_meta' AND t.status = 'pending' AND (t.params->>'meta_id')::int = m.id
  );

-- meta_orcamento_consolidado (iniciativa/atividade removidas deixam de somar)
INSERT INTO task_queue ("type", params)
SELECT 'refresh_meta_orcamento_consolidado'::task_type, jsonb_build_object('meta_id', m.id, 'current_txid', txid_current())
FROM meta m
JOIN pdm p ON p.id = m.pdm_id AND p.removido_em IS NULL
WHERE m.removido_em IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM task_queue t
      WHERE t.type = 'refresh_meta_orcamento_consolidado' AND t.status = 'pending' AND (t.params->>'meta_id')::int = m.id
  );

COMMIT;

-- ============================================================================
-- 10. Perfis de equipe (3012c1b95, d77baba7f): passo fora do SQL
-- ============================================================================

-- perfis_equipe_pdm/perfis_equipe_ps são recalculados em TS. Depois deste script, com a API no ar, chamar:
--   PATCH /api/pessoa/recalc-equipe   (papel SMAE.superadmin, sem corpo)
-- Deve rodar depois das seções 1 e 2, pois a derivação ignora variáveis removidas.
