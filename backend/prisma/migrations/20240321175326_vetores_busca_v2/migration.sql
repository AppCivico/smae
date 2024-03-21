CREATE OR REPLACE FUNCTION f_transferencia_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    new.vetores_busca = (
        SELECT
            to_tsvector(
                'portuguese',
                NEW.objeto || ' ' ||
                CAST(NEW.esfera AS TEXT) || ' ' ||
                CAST(NEW.interface AS TEXT) || ' ' ||
                CAST(NEW.ano AS TEXT) || ' ' ||
                COALESCE(NEW.gestor_contrato, ' ') || ' ' ||
                COALESCE(NEW.secretaria_concedente_str, ' ') || ' ' ||
                tt.nome || ' ' ||
                COALESCE(p.sigla, ' ') || ' ' ||
                COALESCE(p.nome, ' ')  || ' ' ||
                o1.sigla || '' ||
                o1.descricao || '' ||
                o2.sigla || '' ||
                o2.descricao
            )
        FROM transferencia t
        JOIN transferencia_tipo tt ON tt.id = t.tipo_id
        LEFT JOIN partido p ON p.id = t.partido_id
        JOIN orgao o1 ON o1.id = t.orgao_concedente_id
        JOIN orgao o2 ON o2.id = t.secretaria_concedente_id
        WHERE
            t.id = NEW.id
    );

    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';