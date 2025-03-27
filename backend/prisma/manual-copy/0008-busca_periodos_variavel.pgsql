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

