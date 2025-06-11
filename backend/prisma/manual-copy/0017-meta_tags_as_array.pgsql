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

