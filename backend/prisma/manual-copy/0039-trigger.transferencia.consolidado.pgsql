CREATE OR REPLACE PROCEDURE add_refresh_transferencia_task(p_transferencia_id INTEGER)
AS $$
DECLARE
    current_txid bigint;
BEGIN
    current_txid := txid_current();

    IF NOT EXISTS (
        SELECT 1
        FROM task_queue
        WHERE "type" = 'refresh_transferencia'
        AND status = 'pending'
        AND (params->>'transferencia_id')::INTEGER = p_transferencia_id
        AND (params->>'current_txid')::bigint = current_txid
        AND criado_em = now()
    ) THEN
        INSERT INTO task_queue ("type", params)
        VALUES ('refresh_transferencia', json_build_object('transferencia_id', p_transferencia_id, 'current_txid', current_txid));
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_add_refresh_transferencia_task(p_transferencia_id INTEGER)
RETURNS VOID AS
$$
BEGIN
    CALL add_refresh_transferencia_task(p_transferencia_id);
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_tarefa_refresh_transferencia_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_transferencia_id INTEGER;
BEGIN

    select transferencia_id into v_transferencia_id
    from tarefa_cronograma where id = NEW.tarefa_cronograma_id;

    IF (v_transferencia_id IS NOT NULL) THEN
        CALL add_refresh_transferencia_task(v_transferencia_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION f_transferencia_refresh_trigger()
RETURNS TRIGGER AS $$
BEGIN
    CALL add_refresh_transferencia_task(NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DO
$$BEGIN
CREATE TRIGGER trg_refresh_transferencia_tarefa_insert
AFTER INSERT ON tarefa
FOR EACH ROW
EXECUTE FUNCTION f_tarefa_refresh_transferencia_trigger();

CREATE TRIGGER trg_refresh_transferencia_tarefa_update
AFTER UPDATE ON tarefa
FOR EACH ROW
WHEN (
    (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    OR
    (OLD.eh_marco IS DISTINCT FROM NEW.eh_marco)
    OR
    (OLD.termino_planejado IS DISTINCT FROM NEW.termino_planejado)
    OR
    (OLD.termino_real IS DISTINCT FROM NEW.termino_real)
    OR
    (OLD.percentual_concluido IS DISTINCT FROM NEW.percentual_concluido)
    OR
    (OLD.n_filhos_imediatos IS DISTINCT FROM NEW.n_filhos_imediatos)
)
EXECUTE FUNCTION f_tarefa_refresh_transferencia_trigger();

CREATE TRIGGER trg_refresh_transferencia_insert
AFTER INSERT ON transferencia
FOR EACH ROW
EXECUTE FUNCTION f_transferencia_refresh_trigger();

CREATE TRIGGER trg_refresh_transferencia_update
AFTER UPDATE ON transferencia
FOR EACH ROW
WHEN (
    (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
)
EXECUTE FUNCTION f_transferencia_refresh_trigger();

EXCEPTION
   WHEN duplicate_object THEN
      NULL;
END;$$;
