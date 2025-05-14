CREATE OR REPLACE PROCEDURE add_refresh_meta_task(p_meta_id INTEGER)
AS $$
DECLARE
    current_txid bigint;
BEGIN
    current_txid := txid_current();

    IF NOT EXISTS (
        SELECT 1
        FROM task_queue
        WHERE "type" = 'refresh_meta'
        AND status = 'pending'
        AND (params->>'meta_id')::INTEGER = p_meta_id
        AND (params->>'current_txid')::bigint = current_txid
        AND criado_em = now()
    ) THEN
        INSERT INTO task_queue ("type", params)
        VALUES ('refresh_meta', json_build_object('meta_id', p_meta_id, 'current_txid', current_txid));
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_add_refresh_meta_task(p_meta_id INTEGER)
RETURNS VOID AS
$$
BEGIN
    CALL add_refresh_meta_task(p_meta_id);
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_etapa_refresh_meta_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    FOR v_meta_id IN (SELECT DISTINCT meta_id FROM view_etapa_rel_meta WHERE etapa_id = NEW.id) LOOP
        PERFORM f_add_refresh_meta_task(v_meta_id);
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION f_meta_refresh_meta_trigger()
RETURNS TRIGGER AS $$
BEGIN
    CALL add_refresh_meta_task(NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_meta_refresh_serie_variavel_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        FOR v_meta_id IN (SELECT DISTINCT meta_id FROM mv_variavel_pdm WHERE variavel_id = OLD.variavel_id) LOOP
            PERFORM f_add_refresh_meta_task(v_meta_id);
        END LOOP;
    ELSE
        FOR v_meta_id IN (SELECT DISTINCT meta_id FROM mv_variavel_pdm WHERE variavel_id = NEW.variavel_id) LOOP
            PERFORM f_add_refresh_meta_task(v_meta_id);
        END LOOP;
    END IF;

    -- For INSERT or UPDATE, return NEW
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION f_meta_refresh_generic_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_meta_id := OLD.meta_id;
    ELSE
        v_meta_id := NEW.meta_id;
    END IF;

    CALL add_refresh_meta_task(v_meta_id);

    -- For INSERT or UPDATE, return NEW
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;


DO
$$BEGIN
CREATE TRIGGER trg_refresh_meta_serie_variavel
AFTER INSERT OR UPDATE OR DELETE ON serie_variavel
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_serie_variavel_trigger();

CREATE TRIGGER trg_refresh_meta
AFTER INSERT OR UPDATE ON meta
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_meta_trigger();

CREATE TRIGGER trg_refresh_meta_etapa
AFTER INSERT OR UPDATE ON etapa
FOR EACH ROW
EXECUTE FUNCTION f_etapa_refresh_meta_trigger();

CREATE TRIGGER trg_refresh_meta_pdm_orcamento_realizado_config
AFTER INSERT OR UPDATE OR DELETE ON pdm_orcamento_realizado_config
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_generic_trigger();

CREATE TRIGGER trg_refresh_meta_status_variavel_ciclo_fisico
AFTER INSERT OR UPDATE OR DELETE ON status_variavel_ciclo_fisico
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_generic_trigger();

CREATE TRIGGER trg_refresh_meta_variavel_ciclo_fisico_qualitativo
AFTER INSERT OR UPDATE OR DELETE ON variavel_ciclo_fisico_qualitativo
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_generic_trigger();

CREATE TRIGGER trg_refresh_meta_formula_composta_ciclo_fisico_qualitativo
AFTER INSERT OR UPDATE OR DELETE ON formula_composta_ciclo_fisico_qualitativo
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_generic_trigger();

CREATE TRIGGER trg_refresh_meta_meta_ciclo_fisico_risco
AFTER INSERT OR UPDATE OR DELETE ON meta_ciclo_fisico_risco
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_generic_trigger();

CREATE TRIGGER trg_refresh_meta_meta_ciclo_fisico_fechamento
AFTER INSERT OR UPDATE OR DELETE ON meta_ciclo_fisico_fechamento
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_generic_trigger();

CREATE TRIGGER trg_refresh_meta_meta_ciclo_fisico_analise
AFTER INSERT OR UPDATE OR DELETE ON meta_ciclo_fisico_analise
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_generic_trigger();

EXCEPTION
   WHEN duplicate_object THEN
      NULL;
END;$$;


