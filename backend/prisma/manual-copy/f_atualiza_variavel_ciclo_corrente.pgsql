CREATE OR REPLACE FUNCTION f_atualiza_variavel_ciclo_corrente(p_variavel_id int)
    RETURNS void
    AS $$
DECLARE
    v_registro RECORD;
    v_ultimo_periodo_valido DATE;
    v_mes_atual DATE := (date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo'))::date;
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
BEGIN
    -- Busca o registro da variável com o nome da coluna atualizado
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

        periodicidade_intervalo(periodicidade) * atraso_meses AS intervalo_atraso
    INTO v_registro
    FROM variavel
    WHERE
        id = p_variavel_id
        AND tipo = 'Global'
        AND variavel_mae_id IS NULL
        AND removido_em IS NULL;

    IF v_registro IS NULL THEN
        RAISE NOTICE 'Variável com ID % não encontrada ou != global/mae', p_variavel_id;
        RETURN;
    END IF;

    IF v_registro.inicio_medicao IS NULL THEN
        RAISE NOTICE 'Variável % sem data de início', p_variavel_id;
        RETURN;
    END IF;

    SELECT fase, ultimo_periodo_valido
         INTO v_fase_corrente, v_ultimo_p_valido_corrente
    FROM variavel_ciclo_corrente
    WHERE variavel_id = p_variavel_id;
    IF (v_fase_corrente IS NULL) THEN
        v_fase_corrente := 'Preenchimento';
    END IF;

    -- Calcula o último período válido usando a função atualizada
--    v_ultimo_periodo_valido := ultimo_periodo_valido(
--        v_registro.periodicidade,
--        v_registro.atraso_meses,
--        v_registro.inicio_medicao
--    );

    -- Busca os ciclos e analisa os atrasos
    FOR v_ciclo IN (
        SELECT xp.xp AS ciclo_data, a.fase, a.referencia_data
        FROM busca_periodos_variavel(p_variavel_id::int) AS g(p, inicio, fim)
        CROSS JOIN generate_series(g.inicio::date, g.fim::date, g.p) AS xp(xp)
        LEFT JOIN variavel_global_ciclo_analise a
            ON a.variavel_id = p_variavel_id
            AND a.referencia_data = xp.xp
            AND ultima_revisao = true
        WHERE xp.xp <  v_mes_atual - v_registro.intervalo_atraso
        ORDER BY 1 DESC
    ) LOOP
        IF (v_ultimo_periodo_valido IS NULL) THEN
            v_ultimo_periodo_valido := v_ciclo.ciclo_data;
        END IF;

        -- fase desejada pra não ser um atraso, exceto se for o ciclo corrente
        IF v_ciclo.fase IS NULL OR v_ciclo.fase != 'Liberacao'  THEN

            IF (v_ciclo.ciclo_data != v_ultimo_periodo_valido) THEN
                v_atrasos := array_append(v_atrasos, v_ciclo.ciclo_data);
            -- ELSE: provavelmente é o ciclo corrente vamos ter que usar as regras das durações
            -- aqui pra considerar o atraso
            END IF;
        END IF;
    END LOOP;

    -- ordena os atrasos de forma ascendente
    v_atrasos := ARRAY(SELECT unnest(v_atrasos) ORDER BY 1);

    -- Se houver atrasos, calcula o prazo
    -- e o atraso não é o mesmo do ciclo corrente (em progresso/preenchimento)
    IF array_length(v_atrasos, 1) > 0 AND v_ultimo_p_valido_corrente != v_atrasos[1] THEN
    raise notice 'v_atrasos: %', v_atrasos;
    raise notice 'v_ultimo_p_valido_corrente: %', v_ultimo_p_valido_corrente;


        v_prazo := v_atrasos[1];

        -- busca a variavel_global_ciclo_analise do mes em atraso
        SELECT * INTO v_quali FROM variavel_global_ciclo_analise
        WHERE variavel_id = p_variavel_id
          AND referencia_data = v_atrasos[1]
          AND ultima_revisao = true;

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
            -- ? pensar aqui,
            v_prazo := v_atrasos[1] + v_registro.dur_preench_interval;
        END IF;

        v_ultimo_periodo_valido := v_atrasos[1];

        -- prazo já tava atraso né... então ta estouradão
        v_proximo_periodo := v_prazo + v_registro.intervalo_atraso;

        RAISE NOTICE 'v_prazo: %', v_prazo;
    ELSE

        v_ultimo_periodo_valido := coalesce(v_atrasos[1], v_ultimo_p_valido_corrente);

        IF (v_fase_corrente = 'Preenchimento') THEN
            v_prazo := v_ultimo_periodo_valido + v_registro.dur_preench_interval;
        ELSIF (v_fase_corrente = 'Validacao') THEN
            v_prazo := v_ultimo_periodo_valido + v_registro.dur_validacao_interval;
        ELSE
            v_prazo := v_ultimo_periodo_valido + v_registro.dur_liberacao_interval;

            -- em teoria, e estourar o prazo, e é um atraso, eh a hora de avançar sozinho

        END IF;

        v_proximo_periodo := v_ultimo_periodo_valido + v_registro.intervalo_atraso;

    END IF;

    IF (v_proximo_periodo IS null) THEN
        RAISE NOTICE 'v_proximo_periodo ficou nulo, isso deve ser variavel no futuro por exemplo, falta tratar';
        return;
    END IF;

    RAISE NOTICE 'v_registro: %', v_registro;


    -- Se há fim de medição, a data limite é o fim de medição
    -- Senão, a data limite é o próximo período (não há fim de medição, basicamente)
    v_data_limite := coalesce(v_registro.fim_medicao, v_proximo_periodo - v_registro.intervalo_atraso) + v_registro.intervalo_atraso;
    RAISE NOTICE 'v_data_limite: %', v_data_limite;

    -- Deleta se a data atual for igual ou posterior à data limite
    IF v_mes_atual >= v_data_limite AND v_registro.fim_medicao IS NOT NULL THEN
        RAISE NOTICE 'Deletando variavel_ciclo_corrente para variável ID %', p_variavel_id;
        DELETE FROM variavel_ciclo_corrente
        WHERE variavel_id = p_variavel_id;
    ELSE
        -- Determina se a data atual está dentro do intervalo válido
        v_corrente := v_mes_atual <= v_data_limite;
        RAISE NOTICE 'v_mes_atual: %', v_mes_atual;
        RAISE NOTICE 'v_corrente: %', v_corrente;

        IF v_corrente THEN
            v_dias_desde_inicio := (v_mes_atual - v_proximo_periodo) + 1;
            RAISE NOTICE 'v_dias_desde_inicio: %', v_dias_desde_inicio;

            IF v_fase_corrente = 'Preenchimento' THEN
                IF v_dias_desde_inicio < v_registro.periodo_preenchimento[1] THEN
                    -- Esconde a fase de preenchimento enquanto não chegar na data
                    v_corrente := false;
                    RAISE NOTICE 'eh_corrente := false pois v_dias_desde_inicio: <= %', v_registro.periodo_preenchimento[1];
                END IF;
            END IF;

        END IF;

        INSERT INTO variavel_ciclo_corrente(
            variavel_id,
            ultimo_periodo_valido,
            fase,
            proximo_periodo_abertura,
            eh_corrente,
            prazo,
            atrasos
        )
        VALUES (
            v_registro.id,
            v_ultimo_periodo_valido,
            v_fase_corrente,
            v_proximo_periodo,
            v_corrente,
            v_prazo,
            v_atrasos
        )
        ON CONFLICT (variavel_id)
            DO UPDATE SET
                ultimo_periodo_valido = EXCLUDED.ultimo_periodo_valido,
                proximo_periodo_abertura = EXCLUDED.proximo_periodo_abertura,
                eh_corrente = EXCLUDED.eh_corrente,
                prazo = EXCLUDED.prazo,
                fase = EXCLUDED.fase,
                atrasos = EXCLUDED.atrasos,
                atualizado_em = now();

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Falha ao atualizar variavel_ciclo_corrente para variável ID %', p_variavel_id;
        END IF;
    END IF;
END;
$$
LANGUAGE plpgsql;

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
                    RAISE NOTICE 'Erro ID %: %', v_record.id, SQLERRM;

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
