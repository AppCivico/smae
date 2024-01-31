CREATE OR REPLACE PROCEDURE add_refresh_meta_task(p_meta_id INTEGER)
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM task_queue
        WHERE "type" = 'refresh_meta'
        AND status = 'pending'
        AND (params->>'meta_id')::INTEGER = p_meta_id
    ) THEN
        INSERT INTO task_queue ("type", params)
        VALUES ('refresh_meta', json_build_object('meta_id', p_meta_id));
    END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION f_etapa_refresh_meta_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN

    select meta_id into v_meta_id
    from view_etapa_rel_meta where etapa_id = NEW.id;

    CALL add_refresh_meta_task(v_meta_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_meta_etapa
AFTER INSERT OR UPDATE ON etapa
FOR EACH ROW
EXECUTE FUNCTION f_etapa_refresh_meta_trigger();

CREATE OR REPLACE FUNCTION f_meta_refresh_meta_trigger()
RETURNS TRIGGER AS $$
BEGIN
    CALL add_refresh_meta_task(NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_meta
AFTER INSERT OR UPDATE ON meta
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_meta_trigger();

CREATE OR REPLACE FUNCTION f_meta_refresh_serie_variavel_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
     IF TG_OP = 'DELETE' THEN
        v_meta_id := (SELECT meta_id FROM mv_variavel_pdm WHERE variavel_id = OLD.variavel_id);
    ELSE
        v_meta_id := (SELECT meta_id FROM mv_variavel_pdm WHERE variavel_id = NEW.variavel_id);
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

CREATE TRIGGER trg_refresh_meta_serie_variavel
AFTER INSERT OR UPDATE OR DELETE ON serie_variavel
FOR EACH ROW
EXECUTE FUNCTION f_meta_refresh_serie_variavel_trigger();


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

CREATE TRIGGER trg_refresh_meta_variavel_ciclo_fisico_pedido_complementacao
AFTER INSERT OR UPDATE OR DELETE ON variavel_ciclo_fisico_pedido_complementacao
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



