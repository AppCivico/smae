CREATE OR REPLACE FUNCTION variavel_participa_do_ciclo (pVariavelId int, dataCiclo date)
    RETURNS boolean
    AS $$
    SELECT
        coalesce((
            SELECT
                TRUE
            FROM
            busca_periodos_variavel (pVariavelId, (
                -- funcao apenas para PDM, se usar isso no PS vai dar errado
                SELECT indicador_id
                FROM indicador_variavel iv
                WHERE iv.variavel_id = pVariavelId
                AND iv.indicador_origem_id IS NULL
                AND desativado = false
                LIMIT 1
            )) AS g (periodo, inicio, fim),
            generate_series(inicio, fim, periodo) p
        WHERE
            p.p = dataCiclo), FALSE);

$$
LANGUAGE SQL COST 10000
STABLE;

