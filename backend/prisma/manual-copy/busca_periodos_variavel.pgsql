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
        min(periodicidade_intervalo (i.periodicidade)),
        min(i.inicio_medicao),
        max(i.fim_medicao)
    FROM
        variavel v
        JOIN indicador_variavel iv ON IV.variavel_id = v.id
        JOIN indicador i ON Iv.indicador_id = i.id
    WHERE
        v.id = pVariavelId
    GROUP BY
        ();
END;
$$
LANGUAGE plpgsql;

