CREATE OR REPLACE FUNCTION f_transferencia_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    new.vetores_busca = (
        SELECT
            to_tsvector(
                'simple',
                COALESCE(CAST(NEW.esfera AS TEXT), '') || ' ' ||
                COALESCE(CAST(NEW.interface AS TEXT), '') || ' ' ||
                COALESCE(CAST(NEW.ano AS TEXT), '') || ' ' ||
                COALESCE(NEW.gestor_contrato, ' ') || ' ' ||
                COALESCE(NEW.secretaria_concedente_str, ' ') || ' ' ||
                COALESCE(NEW.emenda, ' ') || ' ' ||
                COALESCE(NEW.nome_programa, ' ') || ' ' ||
                COALESCE(NEW.objeto, ' ') || ' ' ||
                COALESCE(tt.nome, '') || ' ' ||
                COALESCE(p.sigla, ' ') || ' ' ||
                COALESCE(p.nome, ' ')  || ' ' ||
                COALESCE(o1.sigla, '') || '' ||
                COALESCE(o1.descricao, '') || '' ||
                COALESCE(o2.sigla, '') || '' ||
                COALESCE(o2.descricao, '')
            )
        FROM (SELECT new.partido_id, new.orgao_concedente_id, new.secretaria_concedente_id, new.tipo_id ) t
        JOIN transferencia_tipo tt ON tt.id = t.tipo_id
        LEFT JOIN partido p ON p.id = t.partido_id
        LEFT JOIN orgao o1 ON o1.id = t.orgao_concedente_id
        LEFT JOIN orgao o2 ON o2.id = t.secretaria_concedente_id
    );

    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';
