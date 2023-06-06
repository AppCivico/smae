WITH RECURSIVE etapa_hierarchy AS (
  SELECT id, etapa_pai_id
  FROM etapa
  WHERE etapa_pai_id IS NULL
  UNION ALL
  SELECT e.id, e.etapa_pai_id
  FROM etapa e
  INNER JOIN etapa_hierarchy eh ON e.etapa_pai_id = eh.id
)
UPDATE etapa e
SET n_filhos_imediatos = (
  SELECT COUNT(*)
  FROM etapa_hierarchy eh
  WHERE eh.etapa_pai_id = e.id
)
WHERE n_filhos_imediatos IS NULL;

CREATE OR REPLACE FUNCTION increment_n_filhos_imediatos()
  RETURNS TRIGGER AS
$$
BEGIN
  -- Increment the n_filhos_imediatos column of the parent row
  UPDATE etapa
  SET n_filhos_imediatos = COALESCE(n_filhos_imediatos, 0) + 1
  WHERE id = NEW.etapa_pai_id;

  RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER increment_n_filhos_imediatos_trigger
AFTER INSERT ON etapa
FOR EACH ROW
EXECUTE FUNCTION increment_n_filhos_imediatos();

-- Separate function to calculate percentual_execucao
CREATE OR REPLACE FUNCTION calculate_percentual_execucao_for_id(p_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_peso INTEGER;
    total_percentual_execucao_peso NUMERIC;
    child_row RECORD;
BEGIN
    total_peso := 0;
    total_percentual_execucao_peso := 0;

    FOR child_row IN
        SELECT * FROM etapa WHERE etapa_pai_id = p_id
    LOOP
        IF child_row.peso IS NOT NULL AND child_row.percentual_execucao IS NOT NULL THEN
            total_peso := total_peso + child_row.peso;
            total_percentual_execucao_peso := total_percentual_execucao_peso + (child_row.peso * child_row.percentual_execucao);
        END IF;
    END LOOP;

    RAISE NOTICE 'total_peso: %', total_peso;

    IF total_peso > 0 THEN
        UPDATE etapa
        SET percentual_execucao = total_percentual_execucao_peso / total_peso
        WHERE id = p_id;
    END IF;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function
CREATE OR REPLACE FUNCTION calculate_percentual_execucao_trigger()
RETURNS TRIGGER AS $$
DECLARE
    parent_id INTEGER;
    old_percentual_execucao INTEGER;
BEGIN
    -- Call the separate function to calculate percentual_execucao
    old_percentual_execucao := OLD.percentual_execucao;
    PERFORM calculate_percentual_execucao_for_id(NEW.id);

    -- Update parent rows only if the current row's percentual_execucao has changed
    SET session_replication_role = replica;

    IF (SELECT percentual_execucao FROM etapa WHERE id = NEW.id) <> old_percentual_execucao THEN
        parent_id := NEW.etapa_pai_id;
        WHILE parent_id IS NOT NULL LOOP
            PERFORM calculate_percentual_execucao_for_id(parent_id);
            parent_id := (SELECT etapa_pai_id FROM etapa WHERE id = parent_id);
        END LOOP;
    END IF;

    SET session_replication_role = DEFAULT;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trg_calculate_percentual_execucao
AFTER INSERT OR UPDATE ON etapa
FOR EACH ROW
EXECUTE FUNCTION calculate_percentual_execucao_trigger();