CREATE OR REPLACE FUNCTION calculate_percentual_execucao_for_id(p_id INTEGER, is_cronograma BOOLEAN DEFAULT FALSE)
RETURNS INTEGER AS $$
DECLARE
    total_peso INTEGER;
    total_percentual_execucao_peso NUMERIC;
    child_row RECORD;
BEGIN
    total_peso := 0;
    total_percentual_execucao_peso := 0;

    IF is_cronograma = true THEN
        FOR child_row IN
            SELECT * FROM etapa WHERE cronograma_id = p_id AND etapa_pai_id IS NULL
        LOOP
            IF child_row.peso IS NOT NULL AND child_row.percentual_execucao IS NOT NULL THEN
                total_peso := total_peso + child_row.peso;
                total_percentual_execucao_peso := total_percentual_execucao_peso + (child_row.peso * child_row.percentual_execucao);
            END IF;
        END LOOP;
    ELSE
        FOR child_row IN
            SELECT * FROM etapa WHERE etapa_pai_id = p_id
        LOOP
            IF child_row.peso IS NOT NULL AND child_row.percentual_execucao IS NOT NULL THEN
                total_peso := total_peso + child_row.peso;
                total_percentual_execucao_peso := total_percentual_execucao_peso + (child_row.peso * child_row.percentual_execucao);
            END IF;
        END LOOP;
    END IF;

    IF total_peso > 0 AND is_cronograma = false THEN
        UPDATE etapa
        SET percentual_execucao = total_percentual_execucao_peso / total_peso
        WHERE id = p_id;
    ELSIF total_peso > 0 AND is_cronograma = true THEN 
        UPDATE cronograma
        SET percentual_execucao = total_percentual_execucao_peso / total_peso
        WHERE id = p_id;
    END IF;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_percentual_execucao_trigger()
RETURNS TRIGGER AS $$
DECLARE
    parent_id INTEGER;
    old_percentual_execucao INTEGER;
BEGIN
    old_percentual_execucao := OLD.percentual_execucao;
    PERFORM calculate_percentual_execucao_for_id(NEW.id::INTEGER);

    SET session_replication_role = replica;

    IF (SELECT percentual_execucao FROM etapa WHERE id = NEW.id) <> old_percentual_execucao THEN
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

drop function calculate_percentual_execucao_for_id ( integer);