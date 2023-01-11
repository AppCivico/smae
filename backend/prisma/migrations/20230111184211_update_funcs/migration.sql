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

CREATE OR REPLACE FUNCTION meta_tags_as_array (pMetaId int)
    RETURNS json
    AS $$
DECLARE
    _valor json;
BEGIN
    SELECT
        json_agg(json_build_object('id', tag.id, 'descricao', tag.descricao, 'ods_id', tag.ods_id, 'icone', tag.icone)) INTO _valor
    FROM
        meta_tag mt
        JOIN tag ON tag.id = mt.tag_id AND mt.meta_id = pMetaId
            AND tag.removido_em IS NULL;
    RETURN _valor;
END
$$
LANGUAGE plpgsql
STABLE RETURNS NULL ON NULL INPUT;

