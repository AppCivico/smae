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
            '10 year'::interval
        ELSE
            NULL
        END;
$$;

create index idx_serie_variavel_variavel_id_data_valor on serie_variavel( serie, variavel_id , data_valor);

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
