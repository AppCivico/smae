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
    v_pendente_cronograma BOOLEAN;
    v_pendente_orcamento BOOLEAN;

    -- Schedule counters
    v_cronograma_total int := 0;
    v_cronograma_atraso_inicio int := 0;
    v_cronograma_atraso_fim int := 0;
    v_pendencia_cronograma BOOLEAN := FALSE;

    -- Budget counters
    v_orcamento_total int := 0;
    v_orcamento_preenchido int := 0;
    v_pendencia_orcamento BOOLEAN := FALSE;

    -- Variable counters
    v_variaveis_total int := 0;
    v_variaveis_a_coletar int := 0;
    v_variaveis_a_coletar_atrasadas int := 0;
    v_variaveis_coletadas_nao_conferidas int := 0;
    v_variaveis_conferidas_nao_liberadas int := 0;
    v_variaveis_liberadas int := 0;

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
        cf.pdm_id, cf.data_ciclo, cf.id
            INTO
        v_pdm_id, v_data_ciclo, v_CicloFisicoId
    FROM
        ciclo_fisico cf
    JOIN pdm p ON p.id = cf.pdm_id
    JOIN meta m ON m.pdm_id = p.id
    WHERE m.id = pMetaId
    AND cf.ativo
    AND p.sistema IN ('PlanoSetorial', 'ProgramaDeMetas')
    ORDER BY cf.data_ciclo DESC
    LIMIT 1;

    IF (v_CicloFisicoId IS NULL) THEN
        RETURN 'Ciclo Fisico não encontrado';
    END IF;

    -- Get meta phase status
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

        -- Count orçamento (Budget)
        SELECT
            CASE WHEN EXISTS (
                SELECT 1 FROM meta_orcamento o
                WHERE (
                    (r_item.tipo = 'meta' AND o.meta_id = r_item.id) OR
                    (r_item.tipo = 'iniciativa' AND o.iniciativa_id = r_item.id) OR
                    (r_item.tipo = 'atividade' AND o.atividade_id = r_item.id)
                )
                AND o.removido_em IS NULL
            ) THEN 1 ELSE 0 END,
            CASE WHEN EXISTS (
                SELECT 1 FROM meta_orcamento o
                WHERE (
                    (r_item.tipo = 'meta' AND o.meta_id = r_item.id) OR
                    (r_item.tipo = 'iniciativa' AND o.iniciativa_id = r_item.id) OR
                    (r_item.tipo = 'atividade' AND o.atividade_id = r_item.id)
                )
                AND o.custo_previsto IS NOT NULL
                AND o.removido_em IS NULL
            ) THEN 1 ELSE 0 END,
            CASE WHEN EXISTS (
                SELECT 1 FROM meta_orcamento o
                WHERE (
                    (r_item.tipo = 'meta' AND o.meta_id = r_item.id) OR
                    (r_item.tipo = 'iniciativa' AND o.iniciativa_id = r_item.id) OR
                    (r_item.tipo = 'atividade' AND o.atividade_id = r_item.id)
                )
                AND o.custo_previsto IS NULL
                AND o.removido_em IS NULL
            ) THEN TRUE ELSE FALSE END
        INTO
            v_orcamento_total,
            v_orcamento_preenchido,
            v_pendencia_orcamento;

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
        etapa_status AS (
            SELECT
                e.id,
                CASE
                    WHEN e.inicio_previsto < CURRENT_DATE AND e.inicio_real IS NULL THEN 1
                    WHEN e.termino_previsto < CURRENT_DATE AND e.termino_real IS NULL THEN 2
                    ELSE 0
                END AS status
            FROM etapa e
            JOIN cronograma_etapa ce ON e.id = ce.etapa_id
            WHERE ce.cronograma_id IN (SELECT id FROM cronograma_ids)
            AND ce.inativo = FALSE
            AND e.removido_em IS NULL
        )
        SELECT
            COALESCE(COUNT(*), 0),
            COALESCE(COUNT(*) FILTER (WHERE status = 1), 0),
            COALESCE(COUNT(*) FILTER (WHERE status = 2), 0),
            CASE WHEN EXISTS (SELECT 1 FROM etapa_status WHERE status IN (1, 2))
                 THEN TRUE ELSE FALSE END
        INTO
            v_cronograma_total,
            v_cronograma_atraso_inicio,
            v_cronograma_atraso_fim,
            v_pendencia_cronograma
        FROM etapa_status;

        -- Count variables using the variavel_ciclo_corrente table
        WITH vars AS (
            SELECT
                v.id,
                vcc.fase,
                vcc.eh_corrente,
                vcc.atrasos,
                vcc.liberacao_enviada
            FROM variavel v
            JOIN indicador_variavel iv ON v.id = iv.variavel_id
            JOIN indicador i ON iv.indicador_id = i.id
            LEFT JOIN variavel_ciclo_corrente vcc ON vcc.variavel_id = v.id
            -- variavel filhas
            WHERE (
                (r_item.tipo = 'meta' AND i.meta_id = r_item.id) OR
                (r_item.tipo = 'iniciativa' AND i.iniciativa_id = r_item.id) OR
                (r_item.tipo = 'atividade' AND i.atividade_id = r_item.id)
            )
            AND v.removido_em IS NULL
        )
        SELECT
            COUNT(DISTINCT id),
            COUNT(DISTINCT id) FILTER (WHERE eh_corrente = true AND fase = 'Preenchimento' AND (atrasos IS NULL OR atrasos = '{}')),
            COUNT(DISTINCT id) FILTER (WHERE eh_corrente = true AND fase = 'Preenchimento' AND atrasos IS NOT NULL AND atrasos <> '{}'),
            COUNT(DISTINCT id) FILTER (WHERE eh_corrente = true AND fase = 'Validacao'),
            COUNT(DISTINCT id) FILTER (WHERE eh_corrente = true AND fase = 'Liberacao' AND liberacao_enviada = false),
            COUNT(DISTINCT id) FILTER (WHERE eh_corrente = true AND fase = 'Liberacao' AND liberacao_enviada = true)
        INTO
            v_variaveis_total,
            v_variaveis_a_coletar,
            v_variaveis_a_coletar_atrasadas,
            v_variaveis_coletadas_nao_conferidas,
            v_variaveis_conferidas_nao_liberadas,
            v_variaveis_liberadas
        FROM vars;

        v_pendente_orcamento := FALSE;

        -- Calculate pending flags
        IF r_item.tipo = 'meta' THEN
            -- For meta items, check if analysis is missing
            IF NOT v_fase_analise_preenchida THEN
                v_pendente := TRUE;
                v_pendente_variavel := TRUE;
            END IF;
        ELSE
            -- For other items, inherit analysis status from parent meta
            IF NOT v_fase_analise_preenchida THEN
                v_pendente := TRUE;
                v_pendente_variavel := TRUE;
            END IF;
        END IF;

        -- Check schedule delays for all item types
        IF v_pendencia_cronograma THEN
            v_pendente := TRUE;
            v_pendente_cronograma := TRUE;
        END IF;

        -- Insert into consolidated table
        INSERT INTO ps_dashboard_consolidado (
            item_id, tipo, pdm_id, meta_id, iniciativa_id, atividade_id,
            orcamento_total, orcamento_preenchido, pendencia_orcamento,
            cronograma_total, cronograma_atraso_inicio, cronograma_atraso_fim, pendencia_cronograma,
            variaveis_total, variaveis_a_coletar, variaveis_a_coletar_atrasadas,
            variaveis_coletadas_nao_conferidas, variaveis_conferidas_nao_liberadas, variaveis_liberadas,
            fase_atual, fase_analise_preenchida, fase_risco_preenchida, fase_fechamento_preenchida,
            pendente, pendente_variavel, pendente_cronograma, pendente_orcamento,
            ciclo_fisico_id
        ) VALUES (
            r_item.id, r_item.tipo, r_item.pdm_id, r_item.meta_id, r_item.iniciativa_id, r_item.atividade_id,
            v_orcamento_total, v_orcamento_preenchido, v_pendencia_orcamento,
            v_cronograma_total, v_cronograma_atraso_inicio, v_cronograma_atraso_fim, v_pendencia_cronograma,
            v_variaveis_total, v_variaveis_a_coletar, v_variaveis_a_coletar_atrasadas,
            v_variaveis_coletadas_nao_conferidas, v_variaveis_conferidas_nao_liberadas, v_variaveis_liberadas,
            'Analise'::"CicloFase", v_fase_analise_preenchida, v_fase_risco_preenchida, v_fase_fechamento_preenchida,
            v_pendente, v_pendente_variavel, v_pendente_cronograma, v_pendente_orcamento,
            v_CicloFisicoId
        );
    END LOOP;

    v_debug := 'PDM and cycle ' || v_pdm_id || ' ' || v_data_ciclo || ' ' || v_CicloFisicoId;
    RETURN v_debug;
END;
$$ LANGUAGE plpgsql;
