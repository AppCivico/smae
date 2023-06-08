CREATE OR REPLACE FUNCTION calculate_percentual_execucao_trigger()
RETURNS TRIGGER AS $$
DECLARE
    parent_id INTEGER;
BEGIN

    IF (NEW.percentual_execucao <> OLD.percentual_execucao OR NEW.peso <> OLD.peso OR NEW.removido_em IS NOT NULL) OR TG_OP = 'INSERT' THEN
        parent_id := NEW.etapa_pai_id;
        WHILE parent_id IS NOT NULL LOOP
            PERFORM calculate_percentual_execucao_for_id(parent_id);
            parent_id := (SELECT etapa_pai_id FROM etapa WHERE id = parent_id AND removido_em IS NULL);
        END LOOP;
        PERFORM calculate_percentual_execucao_for_id(NEW.cronograma_id, true::BOOLEAN);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;