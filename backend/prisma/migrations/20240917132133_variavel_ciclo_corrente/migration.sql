-- AlterTable
ALTER TABLE "variavel_ciclo_corrente" ADD COLUMN     "eh_corrente" BOOLEAN NOT NULL DEFAULT true;
CREATE OR REPLACE FUNCTION f_atualiza_variavel_ciclo_corrente(p_variavel_id int)
    RETURNS void
    AS $$
DECLARE
    v_record RECORD;
    v_last_valid_period date;
    v_current_date date := date_trunc('month', CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo');
    v_threshold_date date;
    v_corrente boolean;
BEGIN
    SELECT
        id,
        periodicidade,
        atraso_meses,
        inicio_medicao,
        periodicidade_intervalo(periodicidade) * atraso_meses as atraso_intervalo
         INTO v_record
    FROM
        variavel
    WHERE
        id = p_variavel_id
        AND tipo = 'Global'
        AND variavel_mae_id IS NULL
        AND removido_em IS NULL;

    IF v_record IS NULL THEN
        RAISE NOTICE 'Variável com ID % não encontrada ou != global/mae', p_variavel_id;
        RETURN;
    END IF;

    SELECT
        ultimo_periodo_valido(v_record.periodicidade, v_record.atraso_meses) INTO v_last_valid_period;

    -- Calcula o período limite para a variável
    v_threshold_date := v_current_date - v_record.atraso_intervalo - periodicidade_intervalo(v_record.periodicidade);

    -- Verifica se o último período válido é anterior à data limite
    IF v_last_valid_period < v_threshold_date THEN
        DELETE FROM variavel_ciclo_corrente
        WHERE variavel_id = v_record.id;
    ELSE

        v_corrente := v_current_date < v_last_valid_period + periodicidade_intervalo(v_record.periodicidade);

        INSERT INTO variavel_ciclo_corrente(variavel_id, ultimo_periodo_valido, fase, proximo_periodo_abertura, v_corrente)
        VALUES (
            v_record.id,
            v_last_valid_period,
            'Preenchimento',
            v_last_valid_period + v_record.atraso_intervalo,
            v_corrente
    )
        ON CONFLICT (variavel_id)
            DO UPDATE SET
                ultimo_periodo_valido = EXCLUDED.ultimo_periodo_valido,
                proximo_periodo_abertura = EXCLUDED.proximo_periodo_abertura,
                v_corrente = EXCLUDED.v_corrente;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Falha ao atualizar variavel_ciclo_corrente para variável ID %', p_variavel_id;
        END IF;
    END IF;
END;
$$
LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION f_atualiza_todas_variaveis( )
        RETURNS void AS
$$ DECLARE v_record RECORD;

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
