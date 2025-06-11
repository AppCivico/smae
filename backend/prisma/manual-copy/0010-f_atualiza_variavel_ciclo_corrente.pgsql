CREATE OR REPLACE FUNCTION f_atualiza_variavel_ciclo_corrente_recursion(p_variavel_id int, p_recursion_depth int)
    RETURNS void
    AS $$
DECLARE
    v_registro RECORD;
    v_ultimo_periodo_valido DATE;
    v_mes_atual DATE := (date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo'))::date;
    v_dia_atual DATE := (date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo'))::date;
    v_data_limite DATE;
    v_corrente BOOLEAN;
    v_proximo_periodo DATE;
    v_fase_corrente "VariavelFase";
    v_ultimo_p_valido_corrente DATE;
    v_dias_desde_inicio INT;
    v_atrasos DATE[] := ARRAY[]::DATE[];
    v_prazo DATE;
    v_ciclo RECORD;
    v_quali RECORD;
    v_liberacao_enviada BOOLEAN;
    v_eh_liberacao_auto BOOLEAN;
    v_primeiro_registro RECORD;
    v_preenchimento_data_conclusao DATE; -- Data de conclusão do Preenchimento para o ciclo atual
    v_validacao_data_conclusao DATE;   -- Data de conclusão da Validação para o ciclo atual
    v_base_date DATE;
    v_processando_ciclo_atrasado BOOLEAN; -- Indica se estamos processando um ciclo que é genuinamente um "atraso" antigo
    -- Indica se a lógica de avanço automático deve ser relativa (baseada na conclusão da fase anterior)
    -- ou absoluta (baseada nos dias configurados para a fase, respeitando o início da janela da fase)
    v_aplicar_logica_relativa_para_avanco BOOLEAN;
    v_deadline_validacao DATE;
    v_deadline_liberacao DATE;
    v_valores_anterior JSONB; -- necessário para caso o próprio usuário abra a tela, o valor não vai estar na SV, então precisa fazer o LOCF
BEGIN

    IF p_recursion_depth > 10 THEN
        RAISE EXCEPTION 'recursion loop em f_atualiza_variavel_ciclo_corrente';
    END IF;

    -- Busca o registro da variável com o nome da coluna atualizado
    BEGIN
    SELECT
        id,
        periodicidade,
        atraso_meses,
        fim_medicao,
        inicio_medicao,
        periodo_preenchimento,
        periodo_validacao,
        periodo_liberacao,
        periodo_preenchimento[2] - periodo_preenchimento[1] + 1 as dur_preench,
        periodo_validacao[2] - periodo_validacao[1] + 1 as dur_validacao,
        periodo_liberacao[2] - periodo_liberacao[1] + 1 as dur_liberacao,

        ((periodo_preenchimento[2] - periodo_preenchimento[1] + 1) || ' days')::interval  as dur_preench_interval,
        ((periodo_validacao[2] - periodo_validacao[1] + 1) || ' days')::interval  as dur_validacao_interval,
        ((periodo_liberacao[2] - periodo_liberacao[1] + 1) || ' days')::interval as dur_liberacao_interval,

        '1 month'::interval * atraso_meses AS intervalo_atraso
    INTO STRICT v_registro
    FROM variavel
    WHERE
        id = p_variavel_id
        AND tipo = 'Global'
        AND variavel_mae_id IS NULL
        AND removido_em IS NULL;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            --RAISE NOTICE 'Variável com ID % não encontrada ou != global/mae', p_variavel_id;
            RETURN;
        WHEN TOO_MANY_ROWS THEN
            RAISE EXCEPTION 'apenas uma linha esperada para a variavel: %', p_variavel_id;
    END;

    IF v_registro.inicio_medicao IS NULL THEN
        --RAISE NOTICE 'Variável % sem data de início', p_variavel_id;
        RETURN;
    END IF;

    SELECT fase, ultimo_periodo_valido, liberacao_enviada
         INTO v_fase_corrente, v_ultimo_p_valido_corrente, v_liberacao_enviada
    FROM variavel_ciclo_corrente
    WHERE variavel_id = p_variavel_id;
    IF (v_fase_corrente IS NULL) THEN
        v_fase_corrente := 'Preenchimento';
    END IF;

    -- Busca os ciclos e analisa os atrasos
    FOR v_ciclo IN (
        SELECT
            xp.xp AS ciclo_data,
            array_agg( a.fase ) as fases,
            array_agg( DISTINCT a.eh_liberacao_auto ) as eh_liberacao_auto
        FROM busca_periodos_variavel(p_variavel_id::int) AS g(p, inicio, fim)
        CROSS JOIN generate_series(g.inicio::date, g.fim::date, g.p) AS xp(xp)
        LEFT JOIN variavel_global_ciclo_analise a
            ON a.variavel_id = p_variavel_id
            AND a.referencia_data = xp.xp
            AND a.ultima_revisao = true
            AND a.removido_em IS NULL
            AND (a.aprovada = true or a.eh_liberacao_auto)

        WHERE xp.xp <=  v_mes_atual - v_registro.intervalo_atraso
        GROUP BY 1
        ORDER BY 1 DESC
    ) LOOP

    --raise notice 'v_ciclo: %', v_ciclo;
        IF (v_ultimo_periodo_valido IS NULL) THEN
            v_ultimo_periodo_valido := v_ciclo.ciclo_data;
            v_primeiro_registro := v_ciclo;

            IF (v_eh_liberacao_auto IS NULL AND v_ciclo.eh_liberacao_auto[1] IS NOT NULL) THEN
                v_eh_liberacao_auto := v_ciclo.eh_liberacao_auto[1];
            END IF;
        END IF;

        -- fase desejada pra não ser um atraso, exceto se for o ciclo corrente
        IF v_ciclo.fases[1] IS NULL OR NOT ('Liberacao' = ANY(v_ciclo.fases)) THEN

            IF (v_ciclo.ciclo_data != v_ultimo_periodo_valido) THEN
                v_atrasos := array_append(v_atrasos, v_ciclo.ciclo_data::date);
            -- ELSE: provavelmente é o ciclo corrente vamos ter que usar as regras das durações
            -- aqui pra considerar o atraso
            END IF;
        END IF;

    END LOOP;

    --raise notice 'v_ultimo_periodo_valido x -> %', v_ultimo_periodo_valido;

    IF (v_ultimo_periodo_valido IS NULL) THEN
        --RAISE NOTICE 'Nenhum periodo encontrado, removendo variavel_ciclo_corrente para variável ID %', p_variavel_id;
        DELETE FROM variavel_ciclo_corrente WHERE variavel_id = p_variavel_id;
        RETURN;
    END IF;

    -- ordena os atrasos de forma ascendente
    v_atrasos := ARRAY(SELECT unnest(v_atrasos) ORDER BY 1);

    -- Determina se estamos processando um ciclo antigo "atrasado"
    -- e o atraso não é o mesmo do ciclo corrente (em progresso/preenchimento)
    --raise notice 'v_ultimo_p_valido_corrente -> %', v_ultimo_p_valido_corrente;
    --raise notice 'v_atrasos -> %', v_atrasos;
    IF array_length(v_atrasos, 1) > 0 AND v_ultimo_p_valido_corrente != v_atrasos[1] THEN
        v_processando_ciclo_atrasado := TRUE;
        v_prazo := v_atrasos[1];
        SELECT * INTO v_quali FROM variavel_global_ciclo_analise
        WHERE variavel_id = p_variavel_id AND referencia_data = v_atrasos[1] AND ultima_revisao = true;

        IF v_quali.fase IS NOT NULL THEN

            IF v_quali.fase = 'Preenchimento' THEN
                v_prazo := v_atrasos[1] + v_registro.dur_preench_interval;
            ELSIF v_quali.fase = 'Validacao' THEN
                v_prazo := v_atrasos[1] + v_registro.dur_validacao_interval;
            ELSE
                v_prazo := v_atrasos[1] + v_registro.dur_liberacao_interval;
            END IF;

            v_fase_corrente := v_quali.fase;

        ELSE
            v_fase_corrente := 'Preenchimento';

            v_prazo := v_atrasos[1] + v_registro.dur_preench_interval;
        END IF;

        -- prazo já tava atraso né... então ta estouradão
        --RAISE NOTICE 'v_prazo: %', v_prazo;
        v_ultimo_periodo_valido := v_atrasos[1];
    ELSE

        v_processando_ciclo_atrasado := FALSE;

        IF (v_atrasos[1] IS NULL) THEN -- se não há atraso, o ciclo atual é o último válido
            v_ultimo_p_valido_corrente := v_ultimo_periodo_valido;
        END IF;



        -- se ta na liberação, mas não tem nenhuma fase, então apagaram o valor depois já ter sido liberado alguma vez
        -- previamente, então resetamos para preenchimento
        IF (v_fase_corrente = 'Liberacao' AND v_atrasos[1] IS NULL AND v_primeiro_registro.fases[1] IS NULL) THEN
            v_fase_corrente := 'Preenchimento';
            v_ultimo_p_valido_corrente := v_primeiro_registro.ciclo_data;
        END IF;

        -- caso o atraso tenha sido resolvido pelo banco de variáveis [v_eh_liberacao_auto=true]
        -- então façamos a correção aqui do status para liberacao caso esteja sem atraso
        IF (v_eh_liberacao_auto AND v_atrasos[1] IS NULL) THEN
            v_liberacao_enviada := true;
            v_fase_corrente := 'Liberacao';
            v_ultimo_p_valido_corrente := v_primeiro_registro.ciclo_data;
        END IF;
        --raise notice 'calculando prazo v_ultimo_p_valido_corrente -> %', v_ultimo_p_valido_corrente;
        v_ultimo_periodo_valido := coalesce(v_atrasos[1], v_ultimo_p_valido_corrente, v_ultimo_periodo_valido);
        --raise notice 'v_ultimo_periodo_valido após coalesce %', v_ultimo_periodo_valido;
        v_base_date := (v_ultimo_periodo_valido + v_registro.intervalo_atraso)::date;
        --raise notice 'v_base_date após %', v_base_date;

        IF (v_fase_corrente = 'Preenchimento') THEN
            v_prazo := date_trunc('month', v_base_date) + ((v_registro.periodo_preenchimento[2]) || ' days')::interval;
        ELSIF (v_fase_corrente = 'Validacao') THEN
            v_prazo := date_trunc('month', v_base_date) + ((v_registro.periodo_validacao[2]) || ' days')::interval;
        ELSE -- Liberacao

            -- acabou todos os ciclos, não tem mais prazo
            IF v_liberacao_enviada AND v_atrasos[1] IS NULL THEN
                v_prazo := NULL;
            ELSE
                v_prazo := date_trunc('month', v_base_date) + ((v_registro.periodo_liberacao[2]) || ' days')::interval;
            END IF;
        END IF;
        --raise notice 'v_prazo após %', v_prazo;
    END IF;

    -- Determina a lógica de avanço (relativa ou absoluta)
    v_aplicar_logica_relativa_para_avanco := v_processando_ciclo_atrasado;
    IF NOT v_processando_ciclo_atrasado THEN
        -- Se estamos no ciclo corrente, mas a fase atual já passou do prazo absoluto, usar lógica relativa para avançar rápido.
        IF v_prazo IS NOT NULL AND v_dia_atual > v_prazo THEN
            v_aplicar_logica_relativa_para_avanco := TRUE;
        END IF;
    --raise notice 'v_aplicar_logica_relativa_para_avanco -> %', v_aplicar_logica_relativa_para_avanco;
    END IF;

    -- Tenta auto-aprovar 'Validacao' se 'Preenchimento' concluído e prazo de 'Validacao' expirou
    IF v_fase_corrente = 'Validacao' THEN
        -- Verifica se Preenchimento foi aprovado para este ciclo (v_ultimo_periodo_valido)
        IF EXISTS (
            SELECT 1 FROM variavel_global_ciclo_analise
            WHERE variavel_id = p_variavel_id AND referencia_data = v_ultimo_periodo_valido
              AND fase = 'Preenchimento' AND ultima_revisao = true AND aprovada = true AND removido_em IS NULL
        ) THEN
            IF v_aplicar_logica_relativa_para_avanco THEN
                -- Busca a data de conclusão do Preenchimento para o ciclo corrente (v_ultimo_periodo_valido)
                -- Esta query DEVE retornar um valor devido ao IF EXISTS externo.
                SELECT timezone('America/Sao_Paulo', (a.criado_em::timestamp without time zone))::date
                INTO v_preenchimento_data_conclusao
                FROM variavel_global_ciclo_analise a
                WHERE a.variavel_id = p_variavel_id AND a.referencia_data = v_ultimo_periodo_valido
                  AND a.fase = 'Preenchimento' AND a.ultima_revisao = true AND a.aprovada = true AND a.removido_em IS NULL
                ORDER BY a.criado_em DESC LIMIT 1;

                IF v_preenchimento_data_conclusao IS NOT NULL THEN
                    v_deadline_validacao := v_preenchimento_data_conclusao + v_registro.dur_validacao_interval;
                ELSE
                    -- Este caso não deveria ocorrer se o IF EXISTS externo é verdadeiro.
                    -- Se ocorrer, indica uma potencial inconsistência de dados ou lógica.
                    -- Não definir v_deadline_validacao impede o avanço automático até que seja corrigido.
                    RAISE WARNING '[%] VAR: % CICLO: % - Inconsistência: Preenchimento aprovado existe, mas data de conclusão não encontrada para lógica relativa de Validação.', clock_timestamp(), p_variavel_id, v_ultimo_periodo_valido;
                    -- v_deadline_validacao permanecerá NULL, impedindo o auto-avanço abaixo.
                END IF;
            ELSE
                -- Usa prazo absoluto da fase de Validação (baseado no v_base_date que já considera v_ultimo_periodo_valido)
                v_deadline_validacao := date_trunc('month', v_base_date) + ((v_registro.periodo_validacao[2]) || ' days')::interval;
            END IF;

            --RAISE NOTICE '[%] VAR: % CICLO: % FASE_ATUAL: Validacao, DEADLINE_CALC: %, RELATIVA: %', clock_timestamp(), p_variavel_id, v_ultimo_periodo_valido, v_deadline_validacao, v_aplicar_logica_relativa_para_avanco;

            IF v_deadline_validacao IS NOT NULL AND v_dia_atual >= v_deadline_validacao AND NOT EXISTS (
                   SELECT 1 FROM variavel_global_ciclo_analise
                   WHERE variavel_id = p_variavel_id AND referencia_data = v_ultimo_periodo_valido
                     AND fase = 'Validacao' AND ultima_revisao = true AND aprovada = true AND removido_em IS NULL
               ) THEN
                --RAISE NOTICE '[%] Auto-aprovando Validacao para var %, ciclo %. Deadline: %, Relativa: %', clock_timestamp(), p_variavel_id, v_ultimo_periodo_valido, v_deadline_validacao, v_aplicar_logica_relativa_para_avanco;

                SELECT valores INTO v_valores_anterior
                FROM variavel_global_ciclo_analise
                WHERE variavel_id = p_variavel_id AND referencia_data = v_ultimo_periodo_valido
                  AND fase = 'Preenchimento' AND ultima_revisao = true AND removido_em IS NULL
                ORDER BY criado_em DESC LIMIT 1;

                INSERT INTO variavel_global_ciclo_analise (
                    variavel_id,
                    fase,
                    referencia_data,
                    informacoes_complementares,
                    eh_liberacao_auto,
                    aprovada,
                    criado_por,
                    ultima_revisao,
                    valores
                ) VALUES (
                    p_variavel_id,
                    'Validacao',
                    v_ultimo_periodo_valido,
                    'Aprovação automática de Validação por decurso de prazo',
                    true,
                    true,
                    -1,
                    true,
                    COALESCE(v_valores_anterior, '[]'::jsonb)
                );

                UPDATE variavel_ciclo_corrente SET fase = 'Liberacao', liberacao_enviada = false
                WHERE variavel_id = p_variavel_id;

                PERFORM f_atualiza_variavel_ciclo_corrente_recursion(p_variavel_id, p_recursion_depth + 1);
                RETURN;
            END IF;

        END IF; -- Fim IF EXISTS Preenchimento aprovado
    END IF; -- Fim IF v_fase_corrente = 'Validacao'


    -- Tenta auto-aprovar 'Liberacao' se 'Validacao' concluída e prazo de 'Liberacao' expirou
    IF v_fase_corrente = 'Liberacao' THEN
        -- Verifica se Validação foi aprovada para este ciclo
        SELECT timezone('America/Sao_Paulo', (criado_em::timestamp without time zone))::date
        INTO v_validacao_data_conclusao
        FROM variavel_global_ciclo_analise
        WHERE variavel_id = p_variavel_id AND referencia_data = v_ultimo_periodo_valido
            AND fase = 'Validacao' AND ultima_revisao = true AND removido_em IS NULL AND aprovada = true
        ORDER BY criado_em DESC LIMIT 1;

        IF v_validacao_data_conclusao IS NOT NULL THEN -- Validação foi aprovada

            IF v_aplicar_logica_relativa_para_avanco THEN
                v_deadline_liberacao := v_validacao_data_conclusao + v_registro.dur_liberacao_interval;
                -- Não há fallback para v_atrasos[1] aqui, pois depende da conclusão da validação.
            ELSE
                -- Usa prazo absoluto da fase de Liberação
                v_deadline_liberacao := date_trunc('month', v_base_date) + ((v_registro.periodo_liberacao[2]) || ' days')::interval;
            END IF;

            IF v_deadline_liberacao IS NOT NULL AND v_dia_atual >= v_deadline_liberacao AND NOT EXISTS (
                   SELECT 1 FROM variavel_global_ciclo_analise
                   WHERE variavel_id = p_variavel_id AND referencia_data = v_ultimo_periodo_valido
                     AND fase = 'Liberacao' AND ultima_revisao = true AND removido_em IS NULL -- Aprovada=true or eh_liberacao_auto=true
           ) THEN
                --RAISE NOTICE '[%] Auto-aprovando Liberacao para var %, ciclo %. Deadline: %, Relativa: %',clock_timestamp(), p_variavel_id, v_ultimo_periodo_valido, v_deadline_liberacao, v_aplicar_logica_relativa_para_avanco;

                SELECT valores INTO v_valores_anterior
                FROM variavel_global_ciclo_analise
                WHERE variavel_id = p_variavel_id AND referencia_data = v_ultimo_periodo_valido
                  AND fase = 'Validacao' AND ultima_revisao = true AND removido_em IS NULL
                ORDER BY criado_em DESC LIMIT 1;

                -- Se não encontrou valores na validação, tenta pegar da fase anterior (Preenchimento)
                IF (v_valores_anterior IS NULL OR v_valores_anterior = '[]'::jsonb) THEN
                    SELECT valores INTO v_valores_anterior
                    FROM variavel_global_ciclo_analise
                    WHERE variavel_id = p_variavel_id AND referencia_data = v_ultimo_periodo_valido
                      AND fase = 'Preenchimento' AND ultima_revisao = true AND removido_em IS NULL
                    ORDER BY criado_em DESC LIMIT 1;
                END IF;

                INSERT INTO variavel_global_ciclo_analise (
                    variavel_id,
                    fase,
                    referencia_data,
                    informacoes_complementares,
                    eh_liberacao_auto,
                    aprovada,
                    criado_por,
                    ultima_revisao,
                    valores
                ) VALUES (
                    p_variavel_id,
                    'Liberacao',
                    v_ultimo_periodo_valido,
                    'Liberação automática por decurso de prazo',
                    true,
                    true,
                    -1,
                    true,
                    COALESCE(v_valores_anterior, '[]'::jsonb)
                );

                UPDATE variavel_ciclo_corrente SET liberacao_enviada = true
                WHERE variavel_id = p_variavel_id; -- Fase já é Liberacao

                PERFORM f_marca_serie_variavel_conferida(p_variavel_id, v_ultimo_periodo_valido);
                PERFORM f_atualiza_variavel_ciclo_corrente_recursion(p_variavel_id, p_recursion_depth + 1);
                RETURN;
            END IF;

        END IF;
    END IF;

    --RAISE NOTICE 'v_registro: %', v_registro;

    v_proximo_periodo := v_ultimo_periodo_valido + periodicidade_intervalo(v_registro.periodicidade);
    -- Assume que sempre é corrente
    v_corrente := true;
    --RAISE NOTICE 'v_dia_atual: %', v_dia_atual;
    --RAISE NOTICE 'v_corrente: %', v_corrente;

    v_dias_desde_inicio := v_dia_atual::date - (v_ultimo_periodo_valido::date + v_registro.intervalo_atraso)::date + 1;
    --RAISE NOTICE 'v_dias_desde_inicio: %', v_dias_desde_inicio;
    --raise notice 'v_proximo_periodo -> %', v_proximo_periodo;

    IF v_fase_corrente = 'Preenchimento' THEN
        v_corrente := true;
        IF v_dias_desde_inicio < v_registro.periodo_preenchimento[1] THEN
            -- Esconde a fase de preenchimento enquanto não chegar na data
            v_corrente := false;
            --RAISE NOTICE 'eh_corrente := false pois v_dias_desde_inicio: < %', v_registro.periodo_preenchimento[1];
        END IF;
    END IF;

    INSERT INTO variavel_ciclo_corrente(
        variavel_id,
        ultimo_periodo_valido,
        fase,
        proximo_periodo_abertura,
        eh_corrente,
        prazo,
        atrasos,
        liberacao_enviada
    )
    VALUES (
        v_registro.id,
        v_ultimo_periodo_valido,
        v_fase_corrente,
        v_proximo_periodo,
        v_corrente,
        v_prazo,
        v_atrasos,
        COALESCE(v_liberacao_enviada, FALSE)
    )
    ON CONFLICT (variavel_id)
        DO UPDATE SET
            ultimo_periodo_valido = EXCLUDED.ultimo_periodo_valido,
            proximo_periodo_abertura = EXCLUDED.proximo_periodo_abertura,
            eh_corrente = EXCLUDED.eh_corrente,
            prazo = EXCLUDED.prazo,
            fase = EXCLUDED.fase,
            atrasos = EXCLUDED.atrasos,
            liberacao_enviada = EXCLUDED.liberacao_enviada,
            atualizado_em = now();


END;
$$
LANGUAGE plpgsql;
--select f_atualiza_variavel_ciclo_corrente (5123 ) ;

--select f_atualiza_variavel_ciclo_corrente(4648);

select f_atualiza_variavel_ciclo_corrente (id) from variavel where tipo='Global' and variavel_mae_id is null;

--SELECT * from variavel_ciclo_corrente WHERE variavel_id = 4633;
--select f_atualiza_variavel_ciclo_corrente( 4633 );

CREATE OR REPLACE FUNCTION f_atualiza_todas_variaveis( )
        RETURNS void AS
$$
DECLARE v_record RECORD;

BEGIN
    FOR v_record IN (
        SELECT
            id
        FROM
            variavel
        WHERE
            tipo = 'Global'
            AND variavel_mae_id IS NULL
            AND removido_em IS NULL)
        LOOP
BEGIN
    PERFORM
        f_atualiza_variavel_ciclo_corrente(v_record.id);

            EXCEPTION
                WHEN OTHERS THEN
                    -- só faz o log do erro e continua o loop
                    --RAISE NOTICE 'Erro ID %: %', v_record.id, SQLERRM;

            END;

END LOOP;

END;

$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_trigger_update_variavel_ciclo()
    RETURNS TRIGGER
    AS $$
BEGIN
    IF(TG_OP = 'UPDATE') OR(TG_OP = 'INSERT') THEN
        PERFORM
            f_atualiza_variavel_ciclo_corrente(NEW.id);
        END IF;
    RETURN NEW;
END;

$$
LANGUAGE plpgsql;

DO
$$BEGIN
CREATE TRIGGER tgr_update_variavel_ciclo_corrente
    AFTER UPDATE ON variavel
    FOR EACH ROW
    WHEN ((
           OLD.fim_medicao IS DISTINCT FROM NEW.fim_medicao
        OR OLD.periodo_preenchimento IS DISTINCT FROM NEW.periodo_preenchimento
        OR OLD.periodo_validacao IS DISTINCT FROM NEW.periodo_validacao
        OR OLD.periodo_liberacao IS DISTINCT FROM NEW.periodo_liberacao
        OR OLD.atraso_meses IS DISTINCT FROM NEW.atraso_meses
        )
    )
    EXECUTE FUNCTION f_trigger_update_variavel_ciclo();

CREATE TRIGGER tgr_insert_variavel_ciclo_corrente
    AFTER INSERT ON variavel
    FOR EACH ROW
    EXECUTE FUNCTION f_trigger_update_variavel_ciclo();
EXCEPTION
   WHEN duplicate_object THEN
      NULL;
END;$$;

DROP FUNCTION IF EXISTS f_variavel_periodos_redimensionados(
    p_preenchimento_phase INT[],
    p_validacao_phase INT[],
    p_liberacao_phase INT[],
    p_date DATE
);

CREATE OR REPLACE FUNCTION f_atualiza_variavel_ciclo_corrente(p_variavel_id int)
    RETURNS void
    AS $$
BEGIN
    PERFORM f_atualiza_variavel_ciclo_corrente_recursion(p_variavel_id, 1);
END;
$$ LANGUAGE plpgsql;
