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
                COALESCE(NEW.emenda, ' ') || ' ' ||
                COALESCE(NEW.nome_programa, ' ') || ' ' ||
                COALESCE(NEW.objeto, ' ') || ' ' ||
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

DROP TRIGGER trigger_transferencia_update_tsvector_update ON transferencia ;
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
    OLD.nome_programa IS DISTINCT FROM NEW.nome_programa
        OR
    OLD.vetores_busca::varchar = ''
)
EXECUTE PROCEDURE f_transferencia_update_tsvector();