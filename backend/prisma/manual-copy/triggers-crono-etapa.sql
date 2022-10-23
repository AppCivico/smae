CREATE OR REPLACE FUNCTION f_trg_estapa_esticar_datas_do_pai() RETURNS trigger AS $emp_stamp$
    BEGIN

        IF NEW.etapa_pai_id IS NOT NULL AND NEW.inicio_previsto IS NOT NULL THEN
            UPDATE etapa e
            SET inicio_previsto = NEW.inicio_previsto
            WHERE e.id = NEW.etapa_pai_id
            AND e.inicio_previsto IS NOT NULL
            AND e.inicio_previsto > NEW.inicio_previsto; -- apenas se tiver maior

        END IF;

        IF NEW.cronograma_id IS NOT NULL AND NEW.inicio_previsto IS NOT NULL THEN

            UPDATE cronograma e
            SET inicio_previsto = NEW.inicio_previsto
            WHERE e.id = NEW.cronograma_id
            AND e.inicio_previsto IS NOT NULL
            AND e.inicio_previsto > NEW.inicio_previsto; -- apenas se tiver maior
        END IF;

        IF NEW.etapa_pai_id IS NOT NULL AND NEW.termino_previsto IS NOT NULL THEN
            UPDATE etapa e
            SET termino_previsto = NEW.termino_previsto
            WHERE e.id = NEW.etapa_pai_id
            AND e.termino_previsto IS NOT NULL
            AND e.termino_previsto < NEW.termino_previsto; -- apenas se tiver menor
        END IF;

        IF NEW.cronograma_id IS NOT NULL AND NEW.termino_previsto IS NOT NULL THEN

            UPDATE cronograma e
            SET termino_previsto = NEW.termino_previsto
            WHERE e.id = NEW.cronograma_id
            AND e.termino_previsto IS NOT NULL
            AND e.termino_previsto < NEW.termino_previsto; -- apenas se tiver menor
        END IF;

        RETURN NEW;
    END;
$emp_stamp$ LANGUAGE plpgsql;


CREATE TRIGGER trg_estapa_esticar_datas_do_pai AFTER INSERT ON etapa
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_estapa_esticar_datas_do_pai();

CREATE TRIGGER trg_estapa_esticar_datas_do_pai_update AFTER  UPDATE ON etapa
    FOR EACH ROW
    WHEN (
        (OLD.inicio_previsto IS DISTINCT FROM NEW.inicio_previsto)
        OR
        (OLD.termino_previsto IS DISTINCT FROM NEW.termino_previsto)
    )
    EXECUTE FUNCTION f_trg_estapa_esticar_datas_do_pai();