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

CREATE OR REPLACE FUNCTION public.ultimo_periodo_valido(pperiodicidade "Periodicidade", patrasomeses integer, piniciomedicao date)
 RETURNS date
 LANGUAGE plpgsql
AS $function$
DECLARE
    vAgora DATE;
    vMesesPorPeriodo INT;
    vUltimoPeriodo DATE;
BEGIN
    -- Get current date truncated to month
    vAgora := date_trunc('month', replaceable_now() AT TIME ZONE 'America/Sao_Paulo');

    -- Convert periodicidade to number of months
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

    -- Calculate last valid period by moving backwards from current date
    -- until we find a valid period considering the delay
    vUltimoPeriodo := vAgora - INTERVAL '1 month' * pAtrasoMeses;

    -- Align with the measurement frequency by moving backwards to the last valid period
    vUltimoPeriodo := pInicioMedicao + (
        FLOOR(
            (EXTRACT(YEAR FROM vUltimoPeriodo) - EXTRACT(YEAR FROM pInicioMedicao)) * 12 +
            (EXTRACT(MONTH FROM vUltimoPeriodo) - EXTRACT(MONTH FROM pInicioMedicao))
        )::int / vMesesPorPeriodo
    ) * vMesesPorPeriodo * INTERVAL '1 month';

    RETURN vUltimoPeriodo;
END;
$function$
