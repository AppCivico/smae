CREATE OR REPLACE FUNCTION f_tgr_task_queue_dedup()
    RETURNS TRIGGER
    AS $$
BEGIN
    DELETE FROM task_queue_dedup WHERE task_id = NEW.id;

    IF NEW.status IN ('pending', 'running') AND NEW.pessoa_id IS NOT NULL AND NEW.removido_em IS NULL THEN
        -- params jsonb tem texto canônico, então o hash bate com o calculado em TaskService.create
        INSERT INTO task_queue_dedup (task_id, pessoa_id, type, params_hash)
        VALUES (NEW.id, NEW.pessoa_id, NEW.type, md5(NEW.params::text))
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_task_queue_dedup_insert ON task_queue;
CREATE TRIGGER tgr_task_queue_dedup_insert
    AFTER INSERT ON task_queue
    FOR EACH ROW
    EXECUTE FUNCTION f_tgr_task_queue_dedup();

DROP TRIGGER IF EXISTS tgr_task_queue_dedup_update ON task_queue;
CREATE TRIGGER tgr_task_queue_dedup_update
    AFTER UPDATE OF status, params, pessoa_id, removido_em ON task_queue
    FOR EACH ROW
    WHEN (
        OLD.status IS DISTINCT FROM NEW.status
        OR OLD.params IS DISTINCT FROM NEW.params
        OR OLD.pessoa_id IS DISTINCT FROM NEW.pessoa_id
        OR OLD.removido_em IS DISTINCT FROM NEW.removido_em
    )
    EXECUTE FUNCTION f_tgr_task_queue_dedup();
