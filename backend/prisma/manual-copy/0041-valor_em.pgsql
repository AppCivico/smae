CREATE OR REPLACE FUNCTION valor_indicador_em(pIndicador_id int, pSerie "Serie", pPeriodo date, janela int)
    RETURNS numeric(95, 60)
    AS $$
DECLARE
    _valor numeric(95, 60);
BEGIN
    SELECT
        si.valor_nominal into _valor
    FROM
        serie_indicador si
    where si.indicador_id = pIndicador_id
    and si.serie = pSerie
    and si.data_valor <= pPeriodo
    and si.data_valor > (pPeriodo - (janela || ' months')::interval)::date
    and ha_conferencia_pendente = false
    order by si.data_valor desc
    LIMIT 1;
    return _valor;
END
$$
LANGUAGE plpgsql STABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION valor_variavel_em(pVariavelId int, pSerie "Serie", pPeriodo date, janela int)
    RETURNS numeric(95, 60)
    AS $$
DECLARE
    _valor numeric(95, 60);
BEGIN
    SELECT
        si.valor_nominal into _valor
    FROM
        serie_variavel si
    where si.variavel_id = pVariavelId
    and si.serie = pSerie
    and si.data_valor <= pPeriodo
    and si.data_valor > (pPeriodo - (janela || ' months')::interval)::date
    and conferida = true
    order by si.data_valor desc
    LIMIT 1;
    return _valor;
END
$$
LANGUAGE plpgsql STABLE RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION valor_variavel_em_json(pVariavelId int, pSerie "Serie", pPeriodo date, janela int)
    RETURNS jsonb
    AS $$
DECLARE
    _valor jsonb;
BEGIN
    SELECT
        jsonb_build_object(
            'valor_nominal',
            round(si.valor_nominal, v.casas_decimais),
            'atualizado_em',
            si.atualizado_em,
            'valor_categorica',
            vcv.titulo
        ) into _valor
    FROM
        serie_variavel si
    LEFT JOIN variavel v ON v.id = si.variavel_id
    LEFT JOIN variavel_categorica_valor vcv ON vcv.id = si.variavel_categorica_valor_id
    where si.variavel_id = pVariavelId
    and si.serie = pSerie
    and si.data_valor <= pPeriodo
    and si.data_valor > (pPeriodo - (janela || ' months')::interval)::date
    and conferida = true
    order by si.data_valor desc
    LIMIT 1;
    return _valor;
END
$$
LANGUAGE plpgsql STABLE RETURNS NULL ON NULL INPUT;
