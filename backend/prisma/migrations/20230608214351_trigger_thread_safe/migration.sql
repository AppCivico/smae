CREATE OR REPLACE FUNCTION calculate_percentual_execucao_for_id(p_id INTEGER, is_cronograma BOOLEAN DEFAULT FALSE)
RETURNS INTEGER AS $$
DECLARE
    total_peso INTEGER;
    total_percentual_execucao_peso NUMERIC;
    child_row RECORD;
BEGIN
    IF current_setting('myvars.skip_trigger')::boolean THEN
        RETURN NEW;
    END IF;

    total_peso := 0;
    total_percentual_execucao_peso := 0;

    IF is_cronograma = true THEN
        FOR child_row IN
            SELECT * FROM etapa WHERE cronograma_id = p_id AND etapa_pai_id IS NULL AND removido_em IS NULL
        LOOP
            IF child_row.peso IS NOT NULL THEN
                total_peso := total_peso + child_row.peso;
                total_percentual_execucao_peso := total_percentual_execucao_peso + (child_row.peso * COALESCE(child_row.percentual_execucao, 0));
            END IF;
        END LOOP;
    ELSE
        FOR child_row IN
            SELECT * FROM etapa WHERE etapa_pai_id = p_id AND removido_em IS NULL
        LOOP
            IF child_row.peso IS NOT NULL THEN
                total_peso := total_peso + child_row.peso;
                total_percentual_execucao_peso := total_percentual_execucao_peso + (child_row.peso * COALESCE(child_row.percentual_execucao, 0));
            END IF;
        END LOOP;
    END IF;

    IF is_cronograma = false THEN
        UPDATE etapa
        SET percentual_execucao = total_percentual_execucao_peso / NULLIF(total_peso, 0)
        WHERE id = p_id;
    ELSIF is_cronograma = true THEN 
        UPDATE cronograma
        SET percentual_execucao = total_percentual_execucao_peso / NULLIF(total_peso, 0)
        WHERE id = p_id;
    END IF;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_percentual_execucao_trigger()
RETURNS TRIGGER AS $$
DECLARE
    parent_id INTEGER;
BEGIN

    SET LOCAL myvars.skip_trigger = true;

    IF (NEW.percentual_execucao <> OLD.percentual_execucao OR NEW.peso <> OLD.peso OR NEW.removido_em <> OLD.removido_em) OR TG_OP = 'INSERT' THEN
        parent_id := NEW.etapa_pai_id;
        WHILE parent_id IS NOT NULL LOOP
            PERFORM calculate_percentual_execucao_for_id(parent_id);
            parent_id := (SELECT etapa_pai_id FROM etapa WHERE id = parent_id AND removido_em IS NULL);
        END LOOP;
        PERFORM calculate_percentual_execucao_for_id(NEW.cronograma_id, true::BOOLEAN);
    END IF;

    SET LOCAL myvars.skip_trigger = false;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;