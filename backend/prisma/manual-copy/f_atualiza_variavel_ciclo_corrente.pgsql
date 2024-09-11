CREATE OR REPLACE FUNCTION f_atualiza_variavel_ciclo_corrente(p_variavel_id INT) RETURNS void AS $$
DECLARE
    v_record RECORD;
    v_last_valid_period DATE;
BEGIN
    SELECT id, periodicidade, atraso_meses
    INTO v_record
    FROM variavel
    WHERE id = p_variavel_id
      AND tipo = 'Global'
      AND variavel_mae_id IS NULL
      AND removido_em IS NULL;

    IF v_record IS NULL THEN
        RAISE NOTICE 'Variável com ID % não encontrada ou != global/mae', p_variavel_id;
        RETURN;
    END IF;

    SELECT ultimo_periodo_valido(v_record.periodicidade, v_record.atraso_meses) INTO v_last_valid_period;

    INSERT INTO variavel_ciclo_corrente (variavel_id, ultimo_periodo_valido, fase, proximo_periodo_abertura)
    VALUES (v_record.id, v_last_valid_period, 'Preenchimento', v_last_valid_period + (v_record.atraso_meses || ' months')::INTERVAL)
    ON CONFLICT (variavel_id) DO UPDATE
    SET ultimo_periodo_valido = EXCLUDED.ultimo_periodo_valido,
        proximo_periodo_abertura = EXCLUDED.proximo_periodo_abertura;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Falha ao atualizar variavel_ciclo_corrente para variável ID %', p_variavel_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_atualiza_todas_variaveis() RETURNS void AS $$
DECLARE
    v_record RECORD;
BEGIN
    FOR v_record IN (
        SELECT id
        FROM variavel
        WHERE tipo = 'Global'
        AND variavel_mae_id IS NULL
        AND removido_em IS NULL
    ) LOOP
        BEGIN
            PERFORM update_variable_state_by_id(v_record.id);
        EXCEPTION WHEN OTHERS THEN
            -- só faz o log do erro e continua o loop
            RAISE NOTICE 'Erro ID %: %', v_record.id, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_trigger_update_variavel_ciclo() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') OR (TG_OP = 'INSERT') THEN
        PERFORM f_atualiza_variavel_ciclo_corrente(NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tgr_update_variavel_ciclo_corrente
AFTER UPDATE ON variavel
FOR EACH ROW
WHEN ((OLD.fim_medicao IS DISTINCT FROM NEW.fim_medicao OR
      OLD.periodo_preenchimento IS DISTINCT FROM NEW.periodo_preenchimento OR
      OLD.periodo_validacao IS DISTINCT FROM NEW.periodo_validacao OR
      OLD.periodo_liberacao IS DISTINCT FROM NEW.periodo_liberacao))
EXECUTE FUNCTION f_trigger_update_variavel_ciclo();

CREATE TRIGGER tgr_insert_variavel_ciclo_corrente
AFTER INSERT ON variavel
FOR EACH ROW
EXECUTE FUNCTION f_trigger_update_variavel_ciclo();

