create materialized view if not exists mv_variavel_pdm as
select
m.id as meta_id,
m.pdm_id as pdm_id,
i.id as indicador_id,
    iv.variavel_id as variavel_id
from meta m
join indicador i on  i.meta_id = m.id and i.removido_em is null
join indicador_variavel iv on iv.indicador_id = i.id and iv.indicador_origem_id is null
where  m.removido_em is null and m.ativo = TRUE
    UNION ALL
select
m.id as meta_id,
m.pdm_id as pdm_id,
i.id as indicador_id,
    iv.variavel_id as variavel_id
from meta m
join iniciativa _i on _i.meta_id = m.id and _i.removido_em is null
join indicador i on  i.iniciativa_id = _i.id and i.removido_em is null
join indicador_variavel iv on iv.indicador_id = i.id and iv.indicador_origem_id is null
where m.removido_em is null and m.ativo = TRUE
    UNION ALL
select
m.id as meta_id,
m.pdm_id as pdm_id,
i.id as indicador_id,
    iv.variavel_id as variavel_id
from meta m
join iniciativa _i on _i.meta_id = m.id and _i.removido_em is null
join atividade _a on _a.iniciativa_id = _i.id and _a.removido_em is null
join indicador i on  i.atividade_id = _a.id and i.removido_em is null
join indicador_variavel iv on iv.indicador_id = i.id and iv.indicador_origem_id is null
where m.removido_em is null and m.ativo = TRUE;

CREATE INDEX IF NOT EXISTS mv_variavel_pdm__variavel_id
ON mv_variavel_pdm (variavel_id);

CREATE INDEX IF NOT EXISTS mv_variavel_pdm__meta_id
ON mv_variavel_pdm (meta_id);


-- Trigger to refresh materialized view when changes occur in indicador_variavel
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_indicador_variavel()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.* IS DISTINCT FROM NEW.*)) THEN
        REFRESH MATERIALIZED VIEW mv_variavel_pdm;
    END IF;

    IF TG_OP = 'DELETE' THEN
        REFRESH MATERIALIZED VIEW mv_variavel_pdm;
        FOR v_meta_id IN (SELECT meta_id FROM mv_variavel_pdm WHERE variavel_id = OLD.variavel_id) LOOP
            PERFORM f_add_refresh_meta_task(v_meta_id);
        END LOOP;
    ELSE
        FOR v_meta_id IN (SELECT meta_id FROM mv_variavel_pdm WHERE variavel_id = NEW.variavel_id) LOOP
            PERFORM f_add_refresh_meta_task(v_meta_id);
        END LOOP;
    END IF;

    -- For INSERT or UPDATE, return NEW
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;




--CREATE TRIGGER trig_refresh_mv_variavel_pdm_indicador_variavel
--AFTER INSERT OR UPDATE ON indicador_variavel
--FOR EACH ROW
--EXECUTE FUNCTION refresh_mv_variavel_pdm_indicador_variavel();
--
--
--CREATE TRIGGER trig_refresh_mv_variavel_pdm_indicador_variavel_delete
--AFTER DELETE ON indicador_variavel
--FOR EACH ROW
--EXECUTE FUNCTION refresh_mv_variavel_pdm_indicador_variavel();

-- Trigger to refresh materialized view when changes occur in atividade
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_atividade()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.removido_em IS DISTINCT FROM NEW.removido_em) THEN
        REFRESH MATERIALIZED VIEW mv_variavel_pdm;
        v_meta_id := (SELECT me.meta_id FROM iniciativa me WHERE me.id = NEW.iniciativa_id);
        CALL add_refresh_meta_task(v_meta_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--CREATE TRIGGER trig_refresh_mv_variavel_pdm_atividade
--AFTER UPDATE ON atividade
--FOR EACH ROW
--EXECUTE FUNCTION refresh_mv_variavel_pdm_atividade();
--
--
---- Trigger to refresh materialized view when changes occur in iniciativa
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_iniciativa()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.removido_em IS DISTINCT FROM NEW.removido_em) THEN
    REFRESH MATERIALIZED VIEW mv_variavel_pdm;

    CALL add_refresh_meta_task(NEW.meta_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--CREATE TRIGGER trig_refresh_mv_variavel_pdm_iniciativa
--AFTER UPDATE ON iniciativa
--FOR EACH ROW
--EXECUTE FUNCTION refresh_mv_variavel_pdm_iniciativa();


-- Trigger to refresh materialized view when changes occur in indicador
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_indicador()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.removido_em IS DISTINCT FROM NEW.removido_em) THEN
        REFRESH MATERIALIZED VIEW mv_variavel_pdm;

        FOR v_meta_id IN (SELECT DISTINCT meta_id FROM mv_variavel_pdm WHERE indicador_id = NEW.id) LOOP
            PERFORM f_add_refresh_meta_task(v_meta_id);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--CREATE TRIGGER trig_refresh_mv_variavel_pdm_indicador
--AFTER UPDATE ON indicador
--FOR EACH ROW
--EXECUTE FUNCTION refresh_mv_variavel_pdm_indicador();


-- Trigger to refresh materialized view when removido_em or ativo columns are changed in meta
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_meta()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.removido_em IS DISTINCT FROM OLD.removido_em OR NEW.ativo IS DISTINCT FROM OLD.ativo) THEN
    REFRESH MATERIALIZED VIEW mv_variavel_pdm;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--CREATE TRIGGER trig_refresh_mv_variavel_pdm_meta
--AFTER INSERT OR UPDATE ON meta
--FOR EACH ROW
--EXECUTE FUNCTION refresh_mv_variavel_pdm_meta();

--CREATE TRIGGER trig_refresh_mv_variavel_pdm_indicador_variavel_delete
--AFTER DELETE ON indicador_variavel
--FOR EACH ROW
--EXECUTE FUNCTION refresh_mv_variavel_pdm_indicador_variavel();
