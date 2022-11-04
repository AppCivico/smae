CREATE OR REPLACE FUNCTION variavel_participa_do_ciclo (pVariavelId int, dataCiclo date)
    RETURNS boolean
    AS $$
    SELECT
        coalesce((
            SELECT
                TRUE
            FROM
            busca_periodos_variavel (pVariavelId) AS g (periodo, inicio, fim),
            generate_series(inicio, fim, periodo) p
        WHERE
            p.p = dataCiclo), FALSE);

$$
LANGUAGE SQL COST 10000
STABLE;

