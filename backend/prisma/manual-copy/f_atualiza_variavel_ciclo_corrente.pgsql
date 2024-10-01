CREATE OR REPLACE FUNCTION f_atualiza_variavel_ciclo_corrente(p_variavel_id int)
    RETURNS void
    AS $$
DECLARE
    v_registro RECORD;
    v_ultimo_periodo_valido DATE;
    v_data_atual DATE := (date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo'))::date;
    v_data_limite DATE;
    v_corrente BOOLEAN;
    v_proximo_periodo DATE;
    v_fase_corrente "VariavelFase";
    v_dias_desde_inicio INT;
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

    SELECT fase INTO v_fase_corrente
    FROM variavel_ciclo_corrente
    WHERE variavel_id = p_variavel_id;

    -- Calcula o último período válido usando a função atualizada
    v_ultimo_periodo_valido := ultimo_periodo_valido(
        v_registro.periodicidade,
        v_registro.atraso_meses,
        v_registro.inicio_medicao
    );

    RAISE NOTICE 'v_registro: %', v_registro;

    -- Calcula o próximo período após o último período válido
    RAISE NOTICE 'v_ultimo_periodo_valido: %', v_ultimo_periodo_valido;
    v_proximo_periodo := v_ultimo_periodo_valido + v_registro.intervalo_atraso;
    RAISE NOTICE 'v_proximo_periodo: %', v_proximo_periodo;

    -- Se há fim de medição, a data limite é o fim de medição
    -- Senão, a data limite é o próximo período (não há fim de medição, basicamente)
    v_data_limite := coalesce(v_registro.fim_medicao, v_proximo_periodo - v_registro.intervalo_atraso) + v_registro.intervalo_atraso;

    RAISE NOTICE 'v_data_limite: %', v_data_limite;

    -- Deleta se a data atual for igual ou posterior à data limite
    IF v_data_atual >= v_data_limite and v_registro.fim_medicao is not null THEN
        RAISE NOTICE 'Deletando variavel_ciclo_corrente para variável ID %', p_variavel_id;
        DELETE FROM variavel_ciclo_corrente
        WHERE variavel_id = p_variavel_id;
    ELSE
        -- Determina se a data atual está dentro do intervalo válido
        v_corrente := v_data_atual <= v_data_limite;
        raise notice 'v_data_atual: %', v_data_atual;
        RAISE NOTICE 'v_corrente: %', v_corrente;

        IF (v_corrente) THEN
            -- Calcula o número de dias desde o início da medição
            v_dias_desde_inicio := (v_data_atual - v_ultimo_periodo_valido) + 1;
            raise notice 'v_dias_desde_inicio: %', v_dias_desde_inicio;

            -- Determina a fase atual com base nos períodos definidos
            IF v_dias_desde_inicio BETWEEN v_registro.periodo_preenchimento[1] AND v_registro.periodo_preenchimento[2] THEN
                v_fase_corrente := 'Preenchimento'::"VariavelFase";
            ELSIF v_dias_desde_inicio BETWEEN v_registro.periodo_validacao[1] AND v_registro.periodo_validacao[2] THEN
                v_fase_corrente := 'Validacao'::"VariavelFase";
            ELSIF v_dias_desde_inicio BETWEEN v_registro.periodo_liberacao[1] AND v_registro.periodo_liberacao[2] THEN
                v_fase_corrente := 'Liberacao'::"VariavelFase";
            ELSE
                -- Se estiver fora de todos os períodos, pode ser bug no cadastro agora
                -- depois que chegar no fim, deixa aberto para 'sempre'
                v_corrente := CASE WHEN v_dias_desde_inicio >= v_registro.periodo_liberacao[2] THEN true ELSE false END;
            END IF;

            --periodo_preenchimento  | {1,10}
            --periodo_validacao      | {11,15}
            --periodo_liberacao      | {16,22}
        END IF;

        INSERT INTO variavel_ciclo_corrente(
            variavel_id,
            ultimo_periodo_valido,
            fase,
            proximo_periodo_abertura,
            eh_corrente
        )
        VALUES (
            v_registro.id,
            v_ultimo_periodo_valido,
            coalesce(v_fase_corrente, 'Preenchimento'::"VariavelFase"),
            v_proximo_periodo,
            v_corrente
        )
        ON CONFLICT (variavel_id)
            DO UPDATE SET
                ultimo_periodo_valido = EXCLUDED.ultimo_periodo_valido,
                proximo_periodo_abertura = EXCLUDED.proximo_periodo_abertura,
                eh_corrente = EXCLUDED.eh_corrente;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Falha ao atualizar variavel_ciclo_corrente para variável ID %', p_variavel_id;
        END IF;
    END IF;
END;
$$
LANGUAGE plpgsql;
 select f_atualiza_variavel_ciclo_corrente(6883);


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

-- problemas pro futuro
CREATE OR REPLACE FUNCTION f_variavel_periodos_redimensionados(
    p_preenchimento_phase INT[],
    p_validacao_phase INT[],
    p_liberacao_phase INT[],
    p_date DATE
)
RETURNS TABLE (
    scaled_preenchimento_start INT,
    scaled_preenchimento_end INT,
    scaled_validacao_start INT,
    scaled_validacao_end INT,
    scaled_liberacao_start INT,
    scaled_liberacao_end INT
)
AS $$
DECLARE
    v_days_in_month INT;
    v_start_preenchimento INT;
    v_duration_preenchimento INT;
    v_duration_validacao INT;
    v_duration_liberacao INT;
    v_total_required_days INT;
    v_actual_preenchimento_end INT;
    v_actual_validacao_end INT;
    v_actual_liberacao_end INT;
BEGIN
    -- Extract values from arrays
    v_start_preenchimento := p_preenchimento_phase[1];
    v_duration_preenchimento := p_preenchimento_phase[2] - p_preenchimento_phase[1] + 1;
    v_duration_validacao := p_validacao_phase[2] - p_validacao_phase[1] + 1;
    v_duration_liberacao := p_liberacao_phase[2] - p_liberacao_phase[1] + 1;

    -- Calculate the total number of days in the given month
    SELECT EXTRACT(DAY FROM (DATE_TRUNC('MONTH', p_date) + INTERVAL '1 MONTH' - INTERVAL '1 DAY')) INTO v_days_in_month;

    -- Total required days to complete all phases
    v_total_required_days := v_start_preenchimento + v_duration_preenchimento + v_duration_validacao + v_duration_liberacao - 1;

    -- Determine if scaling is needed
    IF v_days_in_month < v_total_required_days THEN
        -- Scale down the phases proportionally
        v_duration_preenchimento := LEAST(v_duration_preenchimento, v_days_in_month - v_start_preenchimento + 1);
        v_actual_preenchimento_end := v_start_preenchimento + v_duration_preenchimento - 1;

        -- Adjust validation phase
        IF v_actual_preenchimento_end + v_duration_validacao <= v_days_in_month THEN
            v_actual_validacao_end := v_actual_preenchimento_end + v_duration_validacao;
        ELSE
            v_duration_validacao := LEAST(v_duration_validacao, v_days_in_month - v_actual_preenchimento_end);
            v_actual_validacao_end := v_actual_preenchimento_end + v_duration_validacao;
        END IF;

        -- Adjust liberação phase
        IF v_actual_validacao_end + v_duration_liberacao <= v_days_in_month THEN
            v_actual_liberacao_end := v_actual_validacao_end + v_duration_liberacao;
        ELSE
            v_duration_liberacao := LEAST(v_duration_liberacao, v_days_in_month - v_actual_validacao_end);
            v_actual_liberacao_end := v_actual_validacao_end + v_duration_liberacao;
        END IF;
    ELSE
        -- No need to scale, use original values
        v_actual_preenchimento_end := v_start_preenchimento + v_duration_preenchimento - 1;
        v_actual_validacao_end := v_actual_preenchimento_end + v_duration_validacao;
        v_actual_liberacao_end := v_actual_validacao_end + v_duration_liberacao;
    END IF;

    -- Display notices for debugging
    RAISE NOTICE 'Preenchimento: Start = %, End = %', v_start_preenchimento, v_actual_preenchimento_end;
    RAISE NOTICE 'Validacao: Start = %, End = %', v_actual_preenchimento_end + 1, v_actual_validacao_end;
    RAISE NOTICE 'Liberacao: Start = %, End = %', v_actual_validacao_end + 1, v_actual_liberacao_end;

    -- Return the results
    RETURN QUERY
    SELECT
        v_start_preenchimento AS scaled_preenchimento_start,
        v_actual_preenchimento_end AS scaled_preenchimento_end,
        v_actual_preenchimento_end + 1 AS scaled_validacao_start,
        v_actual_validacao_end AS scaled_validacao_end,
        v_actual_validacao_end + 1 AS scaled_liberacao_start,
        v_actual_liberacao_end AS scaled_liberacao_end;
END;
$$ LANGUAGE plpgsql;
