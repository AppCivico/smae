CREATE OR REPLACE FUNCTION f_marca_serie_variavel_conferida(p_variavel_id int, p_data_valor date)
    RETURNS void
    AS $$
DECLARE
    v_registro RECORD;
    v_filha RECORD;
    v_indicador RECORD;
    v_formula_composta RECORD;
    v_variaveis_modified int[] := ARRAY[]::int[];
    vEarlyReturnSerieConferida boolean;
BEGIN
    -- Busca a variável e verifica se tem filhas
    SELECT
        v.id,
        v.tipo,
        EXISTS (
            SELECT 1
            FROM variavel vf
            WHERE vf.variavel_mae_id = v.id
            AND vf.removido_em IS NULL
            AND vf.tipo in ('Global', 'PDM')
        ) as tem_filhas
    INTO v_registro
    FROM variavel v
    WHERE v.id = p_variavel_id
    AND v.removido_em IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variável % não encontrada', p_variavel_id;
    END IF;

    -- Marca a análise para sincronização na variável mãe
    UPDATE variavel_global_ciclo_analise
    SET
        sincronizar_serie_variavel = true
    WHERE
        variavel_id = p_variavel_id
        AND referencia_data = p_data_valor
        AND ultima_revisao = true
        AND fase = 'Preenchimento'
        AND removido_em IS NULL;

    SELECT value::boolean
    INTO vEarlyReturnSerieConferida
    FROM smae_config
    WHERE key = 'EARLY_RETURN_SERIE_CONFERIDA'
    LIMIT 1;

    -- na teoria não precisamos mais do código abaixo, pois deixamos todo o controle para sempre passar na frente
    -- e usar os valores diretamente da tabela do variavel_global_ciclo_analise
    IF vEarlyReturnSerieConferida THEN
        RETURN;
    END IF;


    -- Se tem filhas, atualiza as filhas
    IF v_registro.tem_filhas THEN
        FOR v_filha IN (
            SELECT vf.id
            FROM variavel vf
            WHERE vf.variavel_mae_id = p_variavel_id
            AND vf.removido_em IS NULL
            AND vf.tipo in ('Global', 'PDM')
        ) LOOP
            -- Marca como conferida apenas a série Realizado das filhas
            UPDATE serie_variavel
            SET
                conferida = true,
                conferida_em = now(),
                conferida_por = -1  -- usando -1 como BOT_USER_ID
            WHERE variavel_id = v_filha.id
            AND data_valor = p_data_valor
            AND serie = 'Realizado';

            -- Adiciona a variável ao array de modificadas
            v_variaveis_modified := array_append(v_variaveis_modified, v_filha.id);

            -- Recalcula série acumulada para cada filha, se necessário
            PERFORM monta_serie_acumulada(v_filha.id, NULL);
        END LOOP;
    ELSE
        -- Se não tem filhas, atualiza a própria variável
        UPDATE serie_variavel
        SET
            conferida = true,
            conferida_em = now(),
            conferida_por = -1  -- usando -1 como BOT_USER_ID
        WHERE variavel_id = p_variavel_id
        AND data_valor = p_data_valor
        AND serie = 'Realizado';

        -- Adiciona a variável ao array de modificadas
        v_variaveis_modified := array_append(v_variaveis_modified, p_variavel_id);

        -- Recalcula série acumulada para a variável, se necessário
        PERFORM monta_serie_acumulada(p_variavel_id, NULL);
    END IF;

    -- Recalcula as variáveis calculadas que dependem das variáveis modificadas
    FOR v_formula_composta IN (
        SELECT DISTINCT fc.variavel_calc_id
        FROM formula_composta fc
        JOIN formula_composta_variavel fcv ON fcv.formula_composta_id = fc.id
        WHERE fcv.variavel_id = ANY(v_variaveis_modified)
        AND fc.variavel_calc_id IS NOT NULL
    ) LOOP
        -- Recalcula a variável calculada
        PERFORM refresh_variavel(v_formula_composta.variavel_calc_id, NULL);
    END LOOP;

    -- Recalcula os indicadores que usam as variáveis modificadas
    FOR v_indicador IN (
        -- Indicadores que usam diretamente
        SELECT DISTINCT i.id
        FROM indicador i
        JOIN indicador_variavel iv ON iv.indicador_id = i.id
        WHERE iv.variavel_id = ANY(v_variaveis_modified)
        AND i.removido_em IS NULL
        UNION
        -- Indicadores que usam via fórmula composta
        SELECT DISTINCT i.id
        FROM indicador i
        JOIN indicador_formula_composta ifc ON ifc.indicador_id = i.id
        JOIN formula_composta fc ON fc.id = ifc.formula_composta_id
        JOIN formula_composta_variavel fcv ON fcv.formula_composta_id = fc.id
        WHERE fcv.variavel_id = ANY(v_variaveis_modified)
        AND i.removido_em IS NULL
    ) LOOP
        -- Recalcula o indicador
        PERFORM refresh_serie_indicador(v_indicador.id, NULL);
    END LOOP;

END;
$$ LANGUAGE plpgsql;
