
drop trigger increment_n_filhos_imediatos_trigger on etapa;

CREATE OR REPLACE FUNCTION update_n_filhos_imediatos()
RETURNS TRIGGER AS $$
DECLARE
    parent_id integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        parent_id := NEW.etapa_pai_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.removido_em IS NULL AND OLD.removido_em IS NOT NULL THEN
            parent_id := NEW.etapa_pai_id;
        ELSIF NEW.removido_em IS NOT NULL AND OLD.removido_em IS NULL THEN
            parent_id := OLD.etapa_pai_id;
        ELSE
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        parent_id := OLD.etapa_pai_id;
    END IF;

    UPDATE etapa
    SET n_filhos_imediatos = (
        SELECT COUNT(*)
        FROM etapa c
        WHERE c.etapa_pai_id = etapa.id
        AND c.removido_em IS NULL
    )
    WHERE id = parent_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_n_filhos_imediatos
AFTER INSERT OR UPDATE OR DELETE ON etapa
FOR EACH ROW
EXECUTE PROCEDURE update_n_filhos_imediatos();

UPDATE etapa e
SET n_filhos_imediatos = (
    SELECT COUNT(*)
    FROM etapa c
    WHERE c.etapa_pai_id = e.id
    AND c.removido_em IS NULL
)
WHERE e.removido_em IS NULL;
