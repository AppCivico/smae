CREATE OR REPLACE FUNCTION periodicidade_intervalo (p "Periodicidade")
    RETURNS interval
    LANGUAGE SQL IMMUTABLE
    AS $$
    SELECT
        CASE WHEN p = 'Mensal' THEN
            '1 month'::interval
        WHEN p = 'Bimestral' THEN
            '2 month'::interval
        WHEN p = 'Trimestral' THEN
            '3 month'::interval
        WHEN p = 'Quadrimestral' THEN
            '4 month'::interval
        WHEN p = 'Semestral' THEN
            '6 month'::interval
        WHEN p = 'Anual' THEN
            '1 year'::interval
        WHEN p = 'Quinquenal' THEN
            '5 year'::interval
        WHEN p = 'Secular' THEN
            '100 year'::interval
        ELSE
            NULL
        END;
$$;

create index if not exists idx_serie_variavel_variavel_id_data_valor on serie_variavel( serie, variavel_id , data_valor);

drop function if exists ultimo_periodo_valido (
    pPeriodicidade "Periodicidade",
    pAtrasoPeriodos INT,
    pInicioMedicao DATE
);

drop function if exists ultimo_periodo_valido("Periodicidade", INT);

/*
CREATE OR REPLACE FUNCTION ultimo_periodo_valido(pPeriodicidade "Periodicidade", pAtrasoMeses INT)
RETURNS DATE
AS $$
DECLARE
    vUltimoPeriodo DATE;
    vIntervalo INTERVAL;
BEGIN
    vUltimoPeriodo := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') - (pAtrasoMeses || ' months')::interval;
    vIntervalo := periodicidade_intervalo(pPeriodicidade);

    IF EXTRACT(YEAR FROM vIntervalo) > 0 THEN
        vUltimoPeriodo := date_trunc('year', vUltimoPeriodo);
        vUltimoPeriodo := vUltimoPeriodo - ((EXTRACT(YEAR FROM vUltimoPeriodo)::integer % EXTRACT(YEAR FROM vIntervalo)::integer) * '1 year'::interval);
    ELSE
        vUltimoPeriodo := vUltimoPeriodo - ((EXTRACT(MONTH FROM vUltimoPeriodo)::integer - 1) % (EXTRACT(MONTH FROM vIntervalo)::integer)) * '1 month'::interval;
    END IF;

    RETURN vUltimoPeriodo;
END;
$$ LANGUAGE plpgsql;
*/

/**
 * Calcula a data do último período válido para medição considerando a periodicidade,
 * atraso permitido e data de início das medições.
 *
 * Esta função é utilizada para determinar qual é o período mais recente que pode receber medições,
 * levando em conta o atraso permitido para inserção dos dados e alinhando com a periodicidade
 * definida a partir da data de início.
 *
 * @param pperiodicidade - Periodicidade da medição ('Mensal', 'Bimestral', 'Trimestral', etc)
 * @param patrasomeses - Quantidade de meses de atraso permitido para inserção dos dados
 * @param piniciomedicao - Data de início das medições (base para cálculo dos períodos)
 *
 * @returns Data do último período válido para medição
 *
 * Exemplos de uso:
 *   Considerando hoje como 2024-01-01:
 *
 *   1. Medição Anual com 1 mês de atraso, iniciada em 1999-12:
 *      SELECT ultimo_periodo_valido('Anual', 1, '1999-12-01') -> 2023-12-01
 *      Explicação: Como permite 1 mês de atraso, e estamos em Jan/2024,
 *                  o último período válido é Dez/2023
 *
 *   2. Medição Anual com 2 meses de atraso, iniciada em 1999-12:
 *      SELECT ultimo_periodo_valido('Anual', 2, '1999-12-01') -> 2022-12-01
 *      Explicação: Com 2 meses de atraso, o último período válido volta para Dez/2022,
 *                  pois alinha com a periodicidade anual a partir da data inicial
 *
 *   3. Medição Mensal com diferentes atrasos, iniciada em 1999-12:
 *      - Com 1 mês: 2023-12-01 (pode medir dezembro em janeiro)
 *      - Com 2 meses: 2023-11-01 (pode medir até novembro em janeiro)
 *      - Com 3 meses: 2023-10-01 (pode medir até outubro em janeiro)
 *
 * Observações:
 * - A data retornada sempre será alinhada com a periodicidade e a data de início,
 *   ou seja, se a medição é trimestral começando em Fev, os períodos serão
 *   Fev/Mai/Ago/Nov
 */

CREATE OR REPLACE FUNCTION public.ultimo_periodo_valido(pperiodicidade "Periodicidade", patrasomeses integer, piniciomedicao date)
 RETURNS date
 LANGUAGE plpgsql
AS $function$
DECLARE
    vAgora DATE;
    vMesesPorPeriodo INT;
    vUltimoPeriodo DATE;
BEGIN
    vAgora := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo');

    vMesesPorPeriodo := CASE pPeriodicidade
        WHEN 'Mensal' THEN 1
        WHEN 'Bimestral' THEN 2
        WHEN 'Trimestral' THEN 3
        WHEN 'Quadrimestral' THEN 4
        WHEN 'Semestral' THEN 6
        WHEN 'Anual' THEN 12
        WHEN 'Secular' THEN 12 * 100
        ELSE 1
    END;

    -- Calcular o último período válido movendo para trás a partir da data atual

    -- 1. Subtrai os meses de atraso da data atual
    -- Ex: Se hoje é Jan/2024 e atraso é 2 meses, move para Nov/2023
    vUltimoPeriodo := vAgora - INTERVAL '1 month' * pAtrasoMeses;

    -- 2. Alinha o período com a data inicial e periodicidade
    -- Exemplo para periodicidade Trimestral começando em Fev/2023:
    -- a) Calcula quantos meses se passaram desde o início (EXTRACT/diferença entre as datas)
    -- b) Divide pelo tamanho do período (vMesesPorPeriodo) e arredonda para baixo (FLOOR)
    -- c) Multiplica novamente pelo tamanho do período para achar o último período completo
    -- d) Soma à data inicial para obter a data final alinhada
    --
    -- Ex: Se vUltimoPeriodo é Nov/2023 e início em Fev/2023:
    -- Meses passados = 9 meses
    -- Para trimestral (3 meses): 9 ÷ 3 = 3 períodos completos
    -- 3 períodos × 3 meses = 9 meses
    -- Fev/2023 + 9 meses = Nov/2023 (mantém pois já está alinhado)
    vUltimoPeriodo := pInicioMedicao + (
        FLOOR(
            (EXTRACT(YEAR FROM vUltimoPeriodo) - EXTRACT(YEAR FROM pInicioMedicao)) * 12 +
            (EXTRACT(MONTH FROM vUltimoPeriodo) - EXTRACT(MONTH FROM pInicioMedicao))
        )::int / vMesesPorPeriodo
    ) * vMesesPorPeriodo * INTERVAL '1 month';

    RETURN vUltimoPeriodo;
END;
$function$;
