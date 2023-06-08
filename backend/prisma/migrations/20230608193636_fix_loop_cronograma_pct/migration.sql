CREATE OR REPLACE FUNCTION calculate_percentual_execucao_trigger()
RETURNS TRIGGER AS $$
DECLARE
    parent_id INTEGER;
BEGIN
    SET session_replication_role = replica;

    IF (NEW.percentual_execucao <> OLD.percentual_execucao OR NEW.peso <> OLD.peso) THEN
        PERFORM calculate_percentual_execucao_for_id(NEW.id::INTEGER);

        parent_id := NEW.etapa_pai_id;
        WHILE parent_id IS NOT NULL LOOP
            PERFORM calculate_percentual_execucao_for_id(parent_id);
            parent_id := (SELECT etapa_pai_id FROM etapa WHERE id = parent_id);
        END LOOP;
        PERFORM calculate_percentual_execucao_for_id(NEW.cronograma_id, true::BOOLEAN);
    END IF;

    SET session_replication_role = DEFAULT;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;