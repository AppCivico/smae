CREATE OR REPLACE FUNCTION f_rebuild_transferencia_tsvector(p_transferencia_id INTEGER)
RETURNS TSVECTOR
LANGUAGE 'plpgsql'
STABLE
AS $$
DECLARE
    v_tsvector_payload TSVECTOR;
BEGIN
    SELECT
        to_tsvector(
            'simple',
            COALESCE(CAST(t_main.esfera AS TEXT), '') || ' ' ||
            COALESCE(CAST(t_main.interface AS TEXT), '') || ' ' ||
            COALESCE(CAST(t_main.ano AS TEXT), '') || ' ' ||
            COALESCE(t_main.gestor_contrato, ' ') || ' ' ||
            COALESCE(t_main.secretaria_concedente_str, ' ') || ' ' ||
            COALESCE(t_main.emenda, ' ') || ' ' ||
            COALESCE(t_main.nome_programa, ' ') || ' ' ||
            COALESCE(t_main.objeto, ' ') || ' ' ||
            COALESCE(t_main.demanda, ' ') || ' ' ||
            COALESCE(tt.nome, ' ') || ' ' ||
            COALESCE(o1.sigla, ' ') || ' ' ||
            COALESCE(o1.descricao, ' ') || ' ' ||
            COALESCE(o2.sigla, ' ') || ' ' ||
            COALESCE(o2.descricao, ' ') || ' ' ||
            COALESCE(
                ( SELECT string_agg(CAST(p.nome_popular AS TEXT), ' ')
                    FROM transferencia_parlamentar tp
                    JOIN parlamentar p ON p.id = tp.parlamentar_id
                    WHERE tp.transferencia_id = t_main.id AND tp.removido_em IS NULL
                ),
                ' '
            ) || ' ' ||
            COALESCE(
                ( SELECT string_agg(CAST(p.sigla AS TEXT), ' ')
                    FROM transferencia_parlamentar tp
                    JOIN partido p ON p.id = tp.partido_id
                    WHERE tp.transferencia_id = t_main.id AND tp.removido_em IS NULL
                ),
                ' '
            ) || ' ' ||
            COALESCE(
                ( SELECT string_agg(CAST(tp.cargo AS TEXT), ' ')
                    FROM transferencia_parlamentar tp
                    WHERE tp.transferencia_id = t_main.id AND tp.removido_em IS NULL
                ),
                ' '
            ) || ' ' ||
            COALESCE(
                ( SELECT string_agg(
                    CAST(o_dr.sigla AS TEXT) || ' ' || CAST(o_dr.descricao AS TEXT) || ' ' || CAST(dr.nome AS TEXT) || ' ' || CAST(dr.objeto AS TEXT), ' ')
                    FROM distribuicao_recurso dr
                    JOIN orgao o_dr ON o_dr.id = dr.orgao_gestor_id
                    WHERE dr.transferencia_id = t_main.id AND dr.removido_em IS NULL
                ),
                ' '
            )
        )
    INTO v_tsvector_payload
    FROM transferencia t_main
    LEFT JOIN transferencia_tipo tt ON tt.id = t_main.tipo_id
    LEFT JOIN orgao o1 ON o1.id = t_main.orgao_concedente_id
    LEFT JOIN orgao o2 ON o2.id = t_main.secretaria_concedente_id
    WHERE t_main.id = p_transferencia_id;

    RETURN v_tsvector_payload;
END;
$$;

DO
$$BEGIN

    CREATE TRIGGER trigger_transferencia_update_tsvector_update
    BEFORE UPDATE ON transferencia
    FOR EACH ROW
    WHEN (
        OLD.objeto IS DISTINCT FROM NEW.objeto
            OR
        OLD.interface IS DISTINCT FROM NEW.interface
            OR
        OLD.ano IS DISTINCT FROM NEW.ano
            OR
        OLD.esfera IS DISTINCT FROM NEW.esfera
            OR
        OLD.gestor_contrato IS DISTINCT FROM NEW.gestor_contrato
            OR
        OLD.tipo_id IS DISTINCT FROM NEW.tipo_id
            OR
        OLD.orgao_concedente_id IS DISTINCT FROM NEW.orgao_concedente_id
            OR
        OLD.secretaria_concedente_id IS DISTINCT FROM NEW.secretaria_concedente_id
            OR
        OLD.emenda IS DISTINCT FROM NEW.emenda
        OR
        OLD.demanda IS DISTINCT FROM NEW.demanda
            OR
        OLD.nome_programa IS DISTINCT FROM NEW.nome_programa
            OR
        OLD.vetores_busca::varchar = ''
    )
    EXECUTE PROCEDURE f_rebuild_transferencia_tsvector();

    CREATE TRIGGER trigger_transferencia_update_tsvector_insert
    BEFORE INSERT ON transferencia
    FOR EACH ROW
    EXECUTE PROCEDURE f_rebuild_transferencia_tsvector();

    CREATE TRIGGER trigger_transferencia_parlamentar_update_tsvector
    AFTER INSERT OR UPDATE ON transferencia_parlamentar
    FOR EACH ROW
    WHEN (NEW.removido_em IS NULL)
    EXECUTE PROCEDURE f_rebuild_transferencia_tsvector();
    EXCEPTION
    WHEN duplicate_object THEN
        NULL;

END;$$;