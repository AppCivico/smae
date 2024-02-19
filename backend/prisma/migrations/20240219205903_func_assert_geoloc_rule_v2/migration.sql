CREATE OR REPLACE FUNCTION assert_geoloc_rule(e_id INTEGER, c_id INTEGER)
RETURNS VOID AS $$
BEGIN
    IF EXISTS(
        SELECT
            1
        FROM cronograma_etapa ce1 
        JOIN etapa e1 ON ce1.etapa_id = e1.id
        LEFT JOIN etapa e2 ON e2.id = e1.etapa_pai_id AND e2.removido_em IS NULL AND e2.endereco_obrigatorio = true
        LEFT JOIN etapa e3 ON e3.id = e2.etapa_pai_id AND e3.removido_em IS NULL AND e3.endereco_obrigatorio = true
        WHERE
            ce1.etapa_id = e_id AND ce1.cronograma_id = c_id AND
            (
                NOT EXISTS ( SELECT 1 FROM geo_localizacao_referencia WHERE removido_em IS NULL AND etapa_id = e1.id ) OR
                NOT EXISTS ( SELECT 1 FROM geo_localizacao_referencia WHERE removido_em IS NULL AND etapa_id = e2.id ) OR 
                NOT EXISTS ( SELECT 1 FROM geo_localizacao_referencia WHERE removido_em IS NULL AND etapa_id = e3.id )
            )
    ) THEN
        RAISE EXCEPTION 'Endereço é obrigatório';
    END IF;
END;
$$ LANGUAGE plpgsql;