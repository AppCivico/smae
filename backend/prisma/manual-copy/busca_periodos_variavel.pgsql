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
        min(periodicidade_intervalo (v.periodicidade)),
        coalesce(v.inicio_medicao, min(i.inicio_medicao)),
        coalesce(v.fim_medicao, max(i.fim_medicao))
    FROM
        variavel v
        JOIN indicador_variavel iv ON IV.variavel_id = v.id and iv.desativado_em is null
        JOIN indicador i ON Iv.indicador_id = i.id
    WHERE
        v.id = pVariavelId
    GROUP BY
        (v.fim_medicao, v.inicio_medicao);
END;
$$
LANGUAGE plpgsql STABLE;

