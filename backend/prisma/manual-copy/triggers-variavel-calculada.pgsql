CREATE OR REPLACE FUNCTION f_trg_formula_composta_variavel_calculada()
    RETURNS TRIGGER
    AS $emp_stamp$
DECLARE
    _debug varchar;
BEGIN
    IF NEW.variavel_calc_id IS NOT NULL THEN
        SELECT
            refresh_variavel(NEW.variavel_calc_id, '{}'::jsonb) INTO _debug;
    END IF;
    RETURN NEW;
END;
$emp_stamp$
LANGUAGE plpgsql;
--
--CREATE TRIGGER trg_formula_composta_variavel_calculada
--    AFTER INSERT OR UPDATE ON formula_composta
--    FOR EACH ROW
--    EXECUTE FUNCTION f_trg_formula_composta_variavel_calculada();
--
