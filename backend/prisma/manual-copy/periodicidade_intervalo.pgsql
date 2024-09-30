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

create index idx_serie_variavel_variavel_id_data_valor on serie_variavel( serie, variavel_id , data_valor);

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

drop function ultimo_periodo_valido("Periodicidade", INT);

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
