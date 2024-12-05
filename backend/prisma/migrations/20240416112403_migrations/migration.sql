CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_indicador()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.removido_em IS DISTINCT FROM NEW.removido_em) THEN
    REFRESH MATERIALIZED VIEW mv_variavel_pdm;

    v_meta_id := (SELECT DISTINCT meta_id FROM mv_variavel_pdm WHERE indicador_id = NEW.id);
    CALL add_refresh_meta_task(v_meta_id);

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


