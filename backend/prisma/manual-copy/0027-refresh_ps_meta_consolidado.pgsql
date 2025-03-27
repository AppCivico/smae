CREATE OR REPLACE FUNCTION refresh_ps_meta_consolidado(pMetaId int)
RETURNS varchar AS $$
DECLARE
    v_pdm_id int;
    v_data_ciclo date;
    v_debug varchar;
    v_CicloFisicoId int;
    -- Phase flags
    v_fase_analise_preenchida BOOLEAN;
    v_fase_risco_preenchida BOOLEAN;
    v_fase_fechamento_preenchida BOOLEAN;
    -- Counters for meta and its children
    v_pendente BOOLEAN;
    v_pendente_variavel BOOLEAN;

    -- Schedule counters
    v_cronograma_total int := 0;
    v_cronograma_atraso_inicio int := 0;
    v_cronograma_atraso_fim int := 0;
    v_cronograma_preenchido int := 0;
    v_pendente_cronograma BOOLEAN := FALSE;
    -- Budget counters
    v_orcamento_total int[] := ARRAY[]::int[];
    v_orcamento_preenchido int[] := ARRAY[]::int[];
    v_pendente_orcamento BOOLEAN := FALSE;
    -- Variable counters
    v_variaveis_total int := 0;
    v_variaveis int[] := ARRAY[]::int[];
    v_variaveis_total_no_ciclo int := 0;
    v_variaveis_a_coletar int := 0;
    v_variaveis_a_coletar_atrasadas int := 0;
    v_variaveis_coletadas_nao_conferidas int := 0;
    v_variaveis_conferidas_nao_liberadas int := 0;
    v_variaveis_liberadas int := 0;
    -- Team arrays
    v_equipes int[] := ARRAY[]::int[];
    v_equipes_orgaos int[] := ARRAY[]::int[];
    -- Temporary records
    r_item RECORD;
BEGIN
    PERFORM pg_advisory_xact_lock(pMetaId);
    v_debug := '';
    IF (pMetaId IS NULL) THEN
        RETURN 'meta_id é obrigatório';
    END IF;
    -- Busca info do ciclo atual, apenas se a meta for do sistemas novos

    SELECT
        p.id AS v_pdm_id,
        cf.data_ciclo AS v_data_ciclo,
        CASE WHEN cf.ativo THEN cf.id ELSE NULL END AS v_CicloFisicoId
            INTO
        v_pdm_id, v_data_ciclo, v_CicloFisicoId

    FROM pdm p
    LEFT JOIN ciclo_fisico cf ON p.id = cf.pdm_id
    JOIN meta m ON m.pdm_id = p.id
    WHERE m.id = pMetaId
      AND p.sistema IN ('PlanoSetorial', 'ProgramaDeMetas')
    ORDER BY cf.data_ciclo DESC NULLS LAST
    LIMIT 1;

    if (v_pdm_id IS NULL) THEN
        RETURN 'v_pdm_id é null';
    END IF;

    -- mesmo se v_CicloFisicoId is NULL, continua
    -- vamos deixar o status de tudo como FALSE
    IF v_CicloFisicoId IS NULL THEN
        v_fase_analise_preenchida := FALSE;
        v_fase_risco_preenchida := FALSE;
        v_fase_fechamento_preenchida := FALSE;
    ELSE
        SELECT
            EXISTS (
                SELECT 1
                FROM meta_ciclo_fisico_analise mcfa
                WHERE mcfa.meta_id = pMetaId
                AND mcfa.ciclo_fisico_id = v_CicloFisicoId
                AND mcfa.ultima_revisao
                AND mcfa.removido_em IS NULL
            ),
            EXISTS (
                SELECT 1
                FROM meta_ciclo_fisico_risco mcfr
                WHERE mcfr.meta_id = pMetaId
                AND mcfr.ciclo_fisico_id = v_CicloFisicoId
                AND mcfr.ultima_revisao
                AND mcfr.removido_em IS NULL
            ),
            EXISTS (
                SELECT 1
                FROM meta_ciclo_fisico_fechamento mcff
                WHERE mcff.meta_id = pMetaId
                AND mcff.ciclo_fisico_id = v_CicloFisicoId
                AND mcff.ultima_revisao
                AND mcff.removido_em IS NULL
            )
        INTO
            v_fase_analise_preenchida,
            v_fase_risco_preenchida,
            v_fase_fechamento_preenchida;
    END IF;

    -- Clear existing data for this meta
    DELETE FROM ps_dashboard_consolidado WHERE meta_id = pMetaId;

    -- Process each item from the view (meta, iniciativa, atividade)
    FOR r_item IN (
        SELECT * FROM view_metas_arvore_pdm WHERE meta_id = pMetaId
    ) LOOP
        -- Reset counters for this item
        v_pendente := FALSE;
        v_pendente_variavel := FALSE;
        v_pendente_cronograma := FALSE;
        v_pendente_orcamento := FALSE;
        v_equipes := ARRAY[]::int[];
        v_equipes_orgaos := ARRAY[]::int[];

        -- Get equipes (teams) and their orgãos
        WITH equipes AS (
            SELECT DISTINCT pp.equipe_id, gre.orgao_id
            FROM pdm_perfil pp
            JOIN grupo_responsavel_equipe gre ON pp.equipe_id = gre.id
            WHERE (
                (r_item.tipo = 'meta' AND pp.meta_id = r_item.id) OR
                (r_item.tipo = 'iniciativa' AND pp.iniciativa_id = r_item.id) OR
                (r_item.tipo = 'atividade' AND pp.atividade_id = r_item.id)
            )
            AND pp.removido_em IS NULL
            AND gre.removido_em IS NULL
        )
        SELECT
            array_agg(DISTINCT equipe_id),
            array_agg(DISTINCT orgao_id)
        INTO
            v_equipes,
            v_equipes_orgaos
        FROM equipes;

        -- If no teams found, initialize as empty arrays
        IF v_equipes IS NULL THEN
            v_equipes := ARRAY[]::int[];
        END IF;

        IF v_equipes_orgaos IS NULL THEN
            v_equipes_orgaos := ARRAY[]::int[];
        END IF;

        -- Count orçamento (Budget) - only for meta level
        IF r_item.tipo = 'meta' THEN
            -- Busca todos os anos até o corrente
            WITH budget_years AS (
                SELECT
                    EXTRACT(YEAR FROM gs) AS year
                FROM generate_series(
                    (SELECT data_inicio FROM pdm WHERE id = v_pdm_id),
                    LEAST(CURRENT_DATE, (
                        SELECT (max(ano_referencia)::text || '-' || '-01-01')::date
                        FROM meta_orcamento_config
                        WHERE pdm_id = v_pdm_id
                    )),
                    '1 year'::interval
                ) AS gs
            ),
            current_config AS (
                SELECT
                    pdoc.ano_referencia,
                    pdoc.execucao_disponivel_meses,
                    -- Find most recent relevant month
                    (SELECT MAX(month)
                     FROM unnest(pdoc.execucao_disponivel_meses) AS month
                     WHERE month <= EXTRACT(MONTH FROM CURRENT_DATE)) AS current_cycle_month
                FROM meta_orcamento_config pdoc
                WHERE pdoc.pdm_id = v_pdm_id
                AND pdoc.ano_referencia = EXTRACT(YEAR FROM CURRENT_DATE)
                AND pdoc.execucao_disponivel = true
            ),
            completion_status AS (
                SELECT
                    porc.ano_referencia,
                    COUNT(DISTINCT mo.orgao_id) AS total_responsible_orgs,
                    COUNT(DISTINCT CASE WHEN porc.execucao_concluida = true THEN porc.orgao_id END) AS completed_orgs
                FROM meta_orgao mo
                LEFT JOIN pdm_orcamento_realizado_config porc ON
                    porc.meta_id = mo.meta_id
                    AND porc.orgao_id = mo.orgao_id
                    AND porc.ultima_revisao = true
                WHERE mo.meta_id = pMetaId
                AND mo.responsavel = true
                GROUP BY porc.ano_referencia
            )
            SELECT
                COALESCE(ARRAY_AGG(by.year), '{}'::int[]) AS total_years,
                COALESCE(
                    ARRAY_AGG("by".year) FILTER (
                        WHERE cs.total_responsible_orgs IS NOT NULL
                        AND cs.completed_orgs = cs.total_responsible_orgs
                    ),
                    '{}'::int[]
                ) AS completed_years
            INTO
                 v_orcamento_total,
                 v_orcamento_preenchido
            FROM budget_years "by"
            LEFT JOIN completion_status cs ON cs.ano_referencia = "by".year;

            v_pendente_orcamento := (
                SELECT COALESCE(array_length(v_orcamento_total, 1), 0) != COALESCE(array_length(v_orcamento_preenchido, 1), 0)
            );

        ELSE
            -- For non-meta items, set budget values to 0
            v_orcamento_total := ARRAY[]::int[];
            v_orcamento_preenchido := ARRAY[]::int[];
            v_pendente_orcamento := FALSE;
        END IF;

        -- Count cronograma (Schedule)
        WITH cronograma_ids AS (
            SELECT c.id
            FROM cronograma c
            WHERE (
                (r_item.tipo = 'meta' AND c.meta_id = r_item.id) OR
                (r_item.tipo = 'iniciativa' AND c.iniciativa_id = r_item.id) OR
                (r_item.tipo = 'atividade' AND c.atividade_id = r_item.id)
            )
            AND c.removido_em IS NULL
        ),
        -- Busca apenas tarefas sem filhos
        leaf_etapas AS (
            SELECT e.id
            FROM etapa e
            JOIN cronograma_etapa ce ON e.id = ce.etapa_id
            WHERE ce.cronograma_id IN (SELECT id FROM cronograma_ids)
            AND ce.inativo = FALSE
            AND e.removido_em IS NULL
            AND NOT EXISTS (
                SELECT 1
                FROM etapa child
                WHERE child.etapa_pai_id = e.id
                AND child.removido_em IS NULL
            )
        ),
        etapa_status AS (
            SELECT
                e.id,
                CASE
                    WHEN e.inicio_previsto < (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date AND e.inicio_real IS NULL THEN 1
                    WHEN e.termino_previsto < (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date AND e.termino_real IS NULL THEN 2
                    ELSE 0
                END AS status,
                CASE
                    WHEN e.inicio_real IS NOT NULL AND e.termino_real IS NOT NULL THEN 1
                    ELSE 0
                END AS preenchido
            FROM etapa e
            JOIN leaf_etapas le ON e.id = le.id
        )
        SELECT
            COALESCE(COUNT(*), 0),
            COALESCE(COUNT(*) FILTER (WHERE status = 1), 0),
            COALESCE(COUNT(*) FILTER (WHERE status = 2), 0),
            COALESCE(SUM(preenchido), 0),
            CASE WHEN EXISTS (SELECT 1 FROM etapa_status WHERE status IN (1, 2))
                 THEN TRUE ELSE FALSE END
        INTO
            v_cronograma_total,
            v_cronograma_atraso_inicio,
            v_cronograma_atraso_fim,
            v_cronograma_preenchido,
            v_pendente_cronograma
        FROM etapa_status;

        -- Count variables using the variavel_ciclo_corrente table
        WITH vars AS (
            SELECT
                -- Usa o parent_id se existir, assim a variável é contada apenas uma vez quando tem pai
                COALESCE(v.variavel_mae_id, v.id) AS family_id,
                v.id,
                vcc.fase,
                vcc.eh_corrente,
                vcc.atrasos,
                vcc.liberacao_enviada
            FROM variavel v
            JOIN indicador_variavel iv ON v.id = iv.variavel_id
            JOIN indicador i ON iv.indicador_id = i.id
            LEFT JOIN variavel_ciclo_corrente vcc ON vcc.variavel_id = COALESCE(v.variavel_mae_id, v.id)
            LEFT JOIN variavel_categorica vc ON v.variavel_categorica_id = vc.id
            WHERE (
                (r_item.tipo = 'meta' AND i.meta_id = r_item.id) OR
                (r_item.tipo = 'iniciativa' AND i.iniciativa_id = r_item.id) OR
                (r_item.tipo = 'atividade' AND i.atividade_id = r_item.id)
            )
            AND v.removido_em IS NULL
            -- tiras as variáveis de cronograma, que o próprio cronograma já contabiliza
            AND (v.variavel_categorica_id IS NULL OR vc.tipo <> 'Cronograma'::"TipoVariavelCategorica")
        )
        SELECT
            COUNT(DISTINCT family_id),
            COALESCE(ARRAY_AGG(DISTINCT family_id), ARRAY[]::int[]),
            COUNT(DISTINCT family_id) FILTER (WHERE eh_corrente = true),
            COUNT(DISTINCT family_id) FILTER (WHERE eh_corrente = true AND fase = 'Preenchimento' AND (atrasos IS NULL OR atrasos = '{}')),
            COUNT(DISTINCT family_id) FILTER (WHERE eh_corrente = true AND fase = 'Preenchimento' AND atrasos IS NOT NULL AND atrasos <> '{}'),
            COUNT(DISTINCT family_id) FILTER (WHERE eh_corrente = true AND fase = 'Validacao'),
            COUNT(DISTINCT family_id) FILTER (WHERE eh_corrente = true AND fase = 'Liberacao' AND liberacao_enviada = false),
            COUNT(DISTINCT family_id) FILTER (WHERE eh_corrente = true AND fase = 'Liberacao' AND liberacao_enviada = true)
        INTO
            v_variaveis_total,
            v_variaveis,
            v_variaveis_total_no_ciclo,
            v_variaveis_a_coletar,
            v_variaveis_a_coletar_atrasadas,
            v_variaveis_coletadas_nao_conferidas,
            v_variaveis_conferidas_nao_liberadas,
            v_variaveis_liberadas
        FROM vars;

        -- any variable in the current cycle is pending
        v_pendente_variavel := v_variaveis_a_coletar > 0;

        -- Calculate phase and pending flags
        IF r_item.tipo = 'meta' THEN
            -- For meta items, check if fechamento is filled
            IF NOT v_fase_fechamento_preenchida THEN
                v_pendente := TRUE;
            END IF;
        END IF;


        IF v_pendente_orcamento OR v_pendente_cronograma OR v_pendente_variavel THEN
            v_pendente := TRUE;
        END IF;

        -- Insert into consolidated table
        INSERT INTO ps_dashboard_consolidado (
            item_id, tipo, pdm_id, meta_id, iniciativa_id, atividade_id,
            orcamento_total, orcamento_preenchido, pendencia_orcamento,
            cronograma_total, cronograma_atraso_inicio, cronograma_atraso_fim, cronograma_preenchido, pendencia_cronograma,
            variaveis_total, variaveis_total_no_ciclo, variaveis_a_coletar, variaveis_a_coletar_atrasadas,
            variaveis_coletadas_nao_conferidas, variaveis_conferidas_nao_liberadas, variaveis_liberadas,
            fase_atual, fase_analise_preenchida, fase_risco_preenchida, fase_fechamento_preenchida,
            equipes, equipes_orgaos,
            pendente, pendente_variavel, pendente_cronograma, pendente_orcamento,
            ciclo_fisico_id,
            variaveis
        ) VALUES (
            r_item.id, r_item.tipo::"PsDashboardConsolidadoTipo", r_item.pdm_id, r_item.meta_id, r_item.iniciativa_id, r_item.atividade_id,
            v_orcamento_total, v_orcamento_preenchido, v_pendente_orcamento,
            v_cronograma_total, v_cronograma_atraso_inicio, v_cronograma_atraso_fim, v_cronograma_preenchido, v_pendente_cronograma,
            v_variaveis_total, v_variaveis_total_no_ciclo, v_variaveis_a_coletar, v_variaveis_a_coletar_atrasadas,
            v_variaveis_coletadas_nao_conferidas, v_variaveis_conferidas_nao_liberadas, v_variaveis_liberadas,
            CASE
                WHEN r_item.tipo = 'meta' and v_CicloFisicoId IS NOT NULL THEN
                    CASE
                        WHEN v_fase_fechamento_preenchida THEN null::"CicloFase"
                        WHEN v_fase_risco_preenchida THEN 'Fechamento'::"CicloFase"
                        WHEN v_fase_analise_preenchida THEN 'Risco'::"CicloFase"
                        ELSE 'Analise'::"CicloFase"
                    END
                ELSE null::"CicloFase"
            END,
            v_fase_analise_preenchida, v_fase_risco_preenchida, v_fase_fechamento_preenchida,
            v_equipes, v_equipes_orgaos,
            v_pendente, v_pendente_variavel, v_pendente_cronograma, v_pendente_orcamento,
            v_CicloFisicoId,
            v_variaveis
        );
    END LOOP;

    v_debug := 'PDM and cycle ' || v_pdm_id || ' ' || coalesce(v_data_ciclo::text,'n/a') || ' ' || coalesce(v_CicloFisicoId::text, 'no ciclo');
    RETURN v_debug;
END;
$$ LANGUAGE plpgsql;

select refresh_ps_meta_consolidado(id) from meta where removido_em is null and pdm_id in (select id from pdm where removido_em is null and sistema != 'PDM');
