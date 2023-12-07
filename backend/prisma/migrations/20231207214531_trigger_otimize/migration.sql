CREATE OR REPLACE FUNCTION f_trigger_recalc_acesso_pessoa() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        CALL f_recalc_acesso_pessoa(NEW.pessoa_id);
    END IF;

    IF TG_OP = 'DELETE' THEN
        CALL f_recalc_acesso_pessoa(OLD.pessoa_id);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variavel_responsavel_recalc_pessoa ON variavel_responsavel;

CREATE TRIGGER trg_variavel_responsavel_recalc_pessoa
AFTER INSERT OR DELETE OR UPDATE ON variavel_responsavel
    FOR EACH ROW
    EXECUTE FUNCTION f_trigger_recalc_acesso_pessoa();
