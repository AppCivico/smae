-- AlterTable
ALTER TABLE "variavel_ciclo_corrente" ADD COLUMN     "eh_corrente" BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION f_atualiza_variavel_ciclo_corrente(p_variavel_id int)
    RETURNS void
    AS $$
DECLARE
    v_registro RECORD;
    v_ultimo_periodo_valido DATE;
    v_data_atual DATE := date_trunc('month', CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo');
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

        IF (v_corrente) THEN
            -- Calcula o número de dias desde o início da medição
            v_dias_desde_inicio := (v_data_atual - v_ultimo_periodo_valido) + 1;

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

    numero_periodos := FLOOR(meses_desde_inicio::float / vMesesIntervalo);

    -- Garantir que o número de períodos não seja negativo
    numero_periodos := GREATEST(numero_periodos, 0);

    -- Calcula o último período válido alinhado com a periodicidade
    -- parte fundamental, btw, que faltou no código original
    vUltimoPeriodo := pInicioMedicao + (numero_periodos * vIntervalo);

    RETURN vUltimoPeriodo;
END;
$$ LANGUAGE plpgsql;

drop function ultimo_periodo_valido("Periodicidade", INT);


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



