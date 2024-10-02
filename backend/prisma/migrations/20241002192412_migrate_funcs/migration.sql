CREATE OR REPLACE FUNCTION busca_periodos_variavel(pVariavelId int, pIndicadorId int)
    RETURNS TABLE (
        periodicidade interval,
        min date,
        max date
    )
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        periodicidade_intervalo (v.periodicidade),
        coalesce(v.inicio_medicao, i.inicio_medicao),
        coalesce(v.fim_medicao, i.fim_medicao)
    FROM
        variavel v
        LEFT JOIN indicador_variavel iv ON IV.variavel_id = v.id and iv.desativado_em is null and iv.indicador_origem_id is null
        LEFT JOIN indicador i ON Iv.indicador_id = i.id AND i.id = pIndicadorId
    WHERE
        v.id = pVariavelId and v.tipo = 'PDM';
END;
$$
LANGUAGE plpgsql STABLE;


CREATE OR REPLACE FUNCTION busca_periodos_variavel (pVariavelId int)
    RETURNS TABLE (
        periodicidade interval,
        min date,
        max date
    )
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        periodicidade_intervalo (v.periodicidade),
        coalesce(v.inicio_medicao),
        coalesce(v.fim_medicao,
            CASE WHEN
                tipo='Global' THEN
                ultimo_periodo_valido( v.periodicidade::"Periodicidade" , v.atraso_meses, v.inicio_medicao)
            ELSE
                NULL
            END
        )
    FROM variavel v
    WHERE
        v.id = pVariavelId AND v.inicio_medicao IS NOT NULL;
END;
$$
LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION ultimo_periodo_valido(
    pPeriodicidade "Periodicidade",
    pAtrasoPeriodos INT,
    pInicioMedicao DATE
)
RETURNS DATE
AS $$
DECLARE
    vUltimoPeriodo DATE;
    vIntervalo INTERVAL;
    vMesesIntervalo INT;
    meses_desde_inicio INT;
    numero_periodos INT;
BEGIN
    vIntervalo := periodicidade_intervalo(pPeriodicidade);

    -- Calcula o número de meses no intervalo
    vMesesIntervalo := EXTRACT(YEAR FROM vIntervalo) * 12 + EXTRACT(MONTH FROM vIntervalo);

    -- Trata o caso onde o intervalo é 0 (ex: para 'Secular')
    IF vMesesIntervalo = 0 THEN
        vMesesIntervalo := 12 * 100; -- Assume que 'Secular' significa 100 anos
    END IF;

    -- Calcula após subtrair o atraso
    vUltimoPeriodo := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') - (pAtrasoPeriodos * vIntervalo);

    -- Calcula o número de períodos completos desde o início da medição até vUltimoPeriodo
    meses_desde_inicio := (EXTRACT(YEAR FROM vUltimoPeriodo) - EXTRACT(YEAR FROM pInicioMedicao)) * 12 +
                          (EXTRACT(MONTH FROM vUltimoPeriodo) - EXTRACT(MONTH FROM pInicioMedicao));

    -- Arredonda pra CIMA o número de períodos
    numero_periodos := CEILING(meses_desde_inicio::float / vMesesIntervalo);

    -- Garantir que o número de períodos não seja negativo
    numero_periodos := GREATEST(numero_periodos, 0);

    -- Calcula o último período válido alinhado com a periodicidade
    vUltimoPeriodo := pInicioMedicao + (numero_periodos * vIntervalo);

    RETURN vUltimoPeriodo;
END;
$$ LANGUAGE plpgsql;

drop function if exists ultimo_periodo_valido("Periodicidade", INT);

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
            -- **Updated Calculation Here**
            v_dias_desde_inicio := (v_mes_atual - v_proximo_periodo) + 1;
            RAISE NOTICE 'v_dias_desde_inicio: %', v_dias_desde_inicio;

            IF v_fase_corrente IS NULL OR v_fase_corrente = 'Preenchimento' THEN
                IF v_dias_desde_inicio < v_registro.periodo_preenchimento[1] THEN
                    -- Esconde a fase de preenchimento enquanto não chegar na data
                    v_corrente := false;
                    RAISE NOTICE 'eh_corrente := false pois v_dias_desde_inicio: <= %', v_registro.periodo_preenchimento[1];
                END IF;
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
            COALESCE(v_fase_corrente, 'Preenchimento'::"VariavelFase"),
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

select f_atualiza_variavel_ciclo_corrente (id) from variavel where tipo='Global' and variavel_mae_id is null;

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
