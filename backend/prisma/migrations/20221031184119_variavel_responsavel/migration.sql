alter table "VariavelResponsavel" rename to variavel_responsavel;




CREATE OR REPLACE FUNCTION f_recalc_acesso_pessoas() RETURNS trigger AS $emp_stamp$
BEGIN
    PERFORM pessoa_acesso_pdm(id) from pessoa where desativado=false;
    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ciclo_fisico_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON ciclo_fisico
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_meta_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON meta
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_iniciativa_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON iniciativa
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_atividade_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON atividade
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_cronograma_etapa_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON cronograma_etapa
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_variavel_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON variavel_responsavel
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();


