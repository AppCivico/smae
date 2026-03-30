CREATE OR REPLACE FUNCTION f_demanda_email_parlamentar_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    NEW.vetores_busca = to_tsvector(
        'simple',
        COALESCE(NEW.assunto, '') || ' ' ||
        COALESCE(NEW.nomes_parlamentares, '')
    );
    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER tsvector_demanda_email_parlamentar_update
    BEFORE INSERT OR UPDATE ON demanda_email_parlamentar
    FOR EACH ROW
    EXECUTE FUNCTION f_demanda_email_parlamentar_update_tsvector();
