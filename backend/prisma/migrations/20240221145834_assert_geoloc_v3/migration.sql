DROP FUNCTION assert_geoloc_rule;
CREATE OR REPLACE FUNCTION assert_geoloc_rule(e_id INTEGER, c_id INTEGER)
RETURNS record
AS $$
DECLARE
    rec record;
BEGIN
    SELECT
        CASE WHEN
            EXISTS (
                SELECT 1 FROM etapa WHERE etapa.id = e2.id AND etapa.endereco_obrigatorio = true AND NOT EXISTS (SELECT 1 FROM geo_localizacao_referencia WHERE removido_em IS NULL AND etapa_id = e2.id)
            )
        THEN e2.titulo ELSE NULL END as e2_titulo,
        CASE WHEN
            EXISTS (
                SELECT 1 FROM etapa WHERE etapa.id = e3.id AND etapa.endereco_obrigatorio = true AND NOT EXISTS (SELECT 1 FROM geo_localizacao_referencia WHERE removido_em IS NULL AND etapa_id = e3.id)
            )
        THEN e3.titulo ELSE NULL END as e3_titulo
    INTO rec
    FROM cronograma_etapa ce1 
    JOIN etapa e1 ON ce1.etapa_id = e1.id
    LEFT JOIN etapa e2 ON e2.id = e1.etapa_pai_id AND e2.removido_em IS NULL
    LEFT JOIN etapa e3 ON e3.id = e2.etapa_pai_id AND e3.removido_em IS NULL
    WHERE
        ce1.etapa_id = e_id AND ce1.cronograma_id = c_id;

    RETURN rec;
END;
$$ LANGUAGE plpgsql;