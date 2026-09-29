CREATE OR REPLACE FUNCTION f_recalc_acesso_pessoas_no_commit()
    RETURNS trigger
    AS $$
BEGIN
    IF current_setting('smae.acesso_pdm_limpo_tx', true) IS DISTINCT FROM txid_current()::text THEN
        PERFORM set_config('smae.acesso_pdm_limpo_tx', txid_current()::text, true);
        DELETE FROM pessoa_acesso_pdm_valido;
        DELETE FROM pessoa_acesso_pdm;
    END IF;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_limpa_status_meta_ciclo_fisico()
    RETURNS trigger
    AS $$
BEGIN
    IF current_setting('smae.status_meta_limpo_tx', true) IS DISTINCT FROM txid_current()::text THEN
        PERFORM set_config('smae.status_meta_limpo_tx', txid_current()::text, true);
        DELETE FROM status_meta_ciclo_fisico;
    END IF;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meta_responsavel_recalc_acesso_pdm ON meta_responsavel;
CREATE CONSTRAINT TRIGGER trg_meta_responsavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON meta_responsavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_iniciativa_responsavel_recalc_acesso_pdm ON iniciativa_responsavel;
CREATE CONSTRAINT TRIGGER trg_iniciativa_responsavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON iniciativa_responsavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_atividade_responsavel_recalc_acesso_pdm ON atividade_responsavel;
CREATE CONSTRAINT TRIGGER trg_atividade_responsavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON atividade_responsavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_indicador_variavel_recalc_acesso_pdm ON indicador_variavel;
CREATE CONSTRAINT TRIGGER trg_indicador_variavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON indicador_variavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_perfil_privilegio_recalc_acesso_pdm ON perfil_privilegio;
CREATE CONSTRAINT TRIGGER trg_perfil_privilegio_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON perfil_privilegio
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_meta_recalc_acesso_pdm ON meta;
CREATE CONSTRAINT TRIGGER trg_meta_recalc_acesso_pdm AFTER INSERT OR DELETE OR UPDATE OF pdm_id, ativo, removido_em ON meta
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_cronograma_recalc_acesso_pdm ON cronograma;
CREATE CONSTRAINT TRIGGER trg_cronograma_recalc_acesso_pdm AFTER INSERT OR DELETE OR UPDATE OF removido_em, meta_id, iniciativa_id, atividade_id ON cronograma
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_cronograma_etapa_recalc_acesso_pdm ON cronograma_etapa;
CREATE CONSTRAINT TRIGGER trg_cronograma_etapa_recalc_acesso_pdm AFTER INSERT OR DELETE OR UPDATE OF inativo, cronograma_id, etapa_id ON cronograma_etapa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_variavel_recalc_acesso_pdm ON variavel;
CREATE CONSTRAINT TRIGGER trg_variavel_recalc_acesso_pdm AFTER INSERT OR DELETE OR UPDATE OF tipo, atraso_meses, removido_em, mostrar_monitoramento, suspendida_em, periodicidade, inicio_medicao, fim_medicao ON variavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_pdm_recalc_acesso_pdm ON pdm;
CREATE CONSTRAINT TRIGGER trg_pdm_recalc_acesso_pdm AFTER UPDATE OF ativo, removido_em ON pdm
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

CREATE OR REPLACE FUNCTION f_invalida_acesso_pdm_pessoa_perfil()
    RETURNS trigger
    AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        DELETE FROM pessoa_acesso_pdm_valido WHERE pessoa_id = OLD.pessoa_id;
        DELETE FROM pessoa_acesso_pdm WHERE pessoa_id = OLD.pessoa_id;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        DELETE FROM pessoa_acesso_pdm_valido WHERE pessoa_id = NEW.pessoa_id;
        DELETE FROM pessoa_acesso_pdm WHERE pessoa_id = NEW.pessoa_id;
    END IF;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pessoa_perfil_recalc_acesso_pdm ON pessoa_perfil;
CREATE TRIGGER trg_pessoa_perfil_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON pessoa_perfil
    FOR EACH ROW
    EXECUTE FUNCTION f_invalida_acesso_pdm_pessoa_perfil();

CREATE OR REPLACE FUNCTION f_invalida_acesso_pdm_pessoa()
    RETURNS trigger
    AS $$
BEGIN
    DELETE FROM pessoa_acesso_pdm_valido WHERE pessoa_id = COALESCE(NEW.id, OLD.id);
    DELETE FROM pessoa_acesso_pdm WHERE pessoa_id = COALESCE(NEW.id, OLD.id);
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pessoa_desativado_recalc_acesso_pdm ON pessoa;
CREATE TRIGGER trg_pessoa_desativado_recalc_acesso_pdm AFTER UPDATE OF desativado ON pessoa
    FOR EACH ROW
    WHEN (OLD.desativado IS DISTINCT FROM NEW.desativado)
    EXECUTE FUNCTION f_invalida_acesso_pdm_pessoa();

CREATE OR REPLACE FUNCTION f_limpa_status_meta_ciclo_fisico_meta()
    RETURNS trigger
    AS $$
BEGIN
    DELETE FROM status_meta_ciclo_fisico WHERE meta_id = NEW.id;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meta_ciclo_fase_limpa_status ON meta;
CREATE TRIGGER trg_meta_ciclo_fase_limpa_status AFTER UPDATE OF ciclo_fase_id ON meta
    FOR EACH ROW
    WHEN (OLD.ciclo_fase_id IS DISTINCT FROM NEW.ciclo_fase_id)
    EXECUTE FUNCTION f_limpa_status_meta_ciclo_fisico_meta();

DROP TRIGGER IF EXISTS trg_etapa_limpa_status_meta ON etapa;
CREATE CONSTRAINT TRIGGER trg_etapa_limpa_status_meta AFTER INSERT OR DELETE OR UPDATE OF inicio_previsto, termino_previsto, inicio_real, termino_real, removido_em, etapa_pai_id ON etapa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_limpa_status_meta_ciclo_fisico();

DROP TRIGGER IF EXISTS trg_cronograma_etapa_limpa_status_meta ON cronograma_etapa;
CREATE CONSTRAINT TRIGGER trg_cronograma_etapa_limpa_status_meta AFTER INSERT OR DELETE OR UPDATE OF inativo, cronograma_id, etapa_id ON cronograma_etapa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_limpa_status_meta_ciclo_fisico();
