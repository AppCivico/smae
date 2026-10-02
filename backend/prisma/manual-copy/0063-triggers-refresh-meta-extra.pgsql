CREATE OR REPLACE FUNCTION f_meta_id_por_hierarquia(p_meta_id INTEGER, p_iniciativa_id INTEGER, p_atividade_id INTEGER)
RETURNS INTEGER AS $$
    SELECT COALESCE(
        p_meta_id,
        (SELECT i.meta_id FROM iniciativa i WHERE i.id = p_iniciativa_id),
        (SELECT i.meta_id FROM atividade a JOIN iniciativa i ON i.id = a.iniciativa_id WHERE a.id = p_atividade_id)
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION f_add_refresh_meta_task_nn(p_meta_id INTEGER)
RETURNS VOID AS $$
BEGIN
    IF p_meta_id IS NOT NULL THEN
        CALL add_refresh_meta_task(p_meta_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_cronograma_refresh_meta_trigger()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM f_add_refresh_meta_task_nn(f_meta_id_por_hierarquia(NEW.meta_id, NEW.iniciativa_id, NEW.atividade_id));

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_cronograma_etapa_refresh_meta_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP <> 'INSERT' THEN
        PERFORM f_add_refresh_meta_task_nn(
            (SELECT f_meta_id_por_hierarquia(c.meta_id, c.iniciativa_id, c.atividade_id) FROM cronograma c WHERE c.id = OLD.cronograma_id)
        );
    END IF;
    IF TG_OP <> 'DELETE' THEN
        PERFORM f_add_refresh_meta_task_nn(
            (SELECT f_meta_id_por_hierarquia(c.meta_id, c.iniciativa_id, c.atividade_id) FROM cronograma c WHERE c.id = NEW.cronograma_id)
        );
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_pdm_perfil_refresh_meta_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP <> 'INSERT' THEN
        PERFORM f_add_refresh_meta_task_nn(f_meta_id_por_hierarquia(OLD.meta_id, OLD.iniciativa_id, OLD.atividade_id));
    END IF;
    IF TG_OP <> 'DELETE' THEN
        PERFORM f_add_refresh_meta_task_nn(f_meta_id_por_hierarquia(NEW.meta_id, NEW.iniciativa_id, NEW.atividade_id));
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_pdm_refresh_meta_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    FOR v_meta_id IN (SELECT m.id FROM meta m WHERE m.pdm_id = NEW.id AND m.removido_em IS NULL) LOOP
        PERFORM f_add_refresh_meta_task(v_meta_id);
    END LOOP;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_meta_cronograma ON cronograma;
CREATE TRIGGER trg_refresh_meta_cronograma
AFTER UPDATE OF removido_em ON cronograma
FOR EACH ROW
WHEN (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
EXECUTE FUNCTION f_cronograma_refresh_meta_trigger();

DROP TRIGGER IF EXISTS trg_refresh_meta_cronograma_etapa ON cronograma_etapa;
CREATE TRIGGER trg_refresh_meta_cronograma_etapa
AFTER INSERT OR DELETE OR UPDATE OF cronograma_id, etapa_id, inativo ON cronograma_etapa
FOR EACH ROW
EXECUTE FUNCTION f_cronograma_etapa_refresh_meta_trigger();

DROP TRIGGER IF EXISTS trg_refresh_meta_pdm_perfil ON pdm_perfil;
CREATE TRIGGER trg_refresh_meta_pdm_perfil
AFTER INSERT OR DELETE OR UPDATE OF meta_id, iniciativa_id, atividade_id, equipe_id, removido_em ON pdm_perfil
FOR EACH ROW
EXECUTE FUNCTION f_pdm_perfil_refresh_meta_trigger();

DROP TRIGGER IF EXISTS trg_refresh_meta_pdm ON pdm;
CREATE TRIGGER trg_refresh_meta_pdm
AFTER UPDATE OF ativo, monitoramento_orcamento, data_inicio ON pdm
FOR EACH ROW
WHEN (
    OLD.ativo IS DISTINCT FROM NEW.ativo
    OR OLD.monitoramento_orcamento IS DISTINCT FROM NEW.monitoramento_orcamento
    OR OLD.data_inicio IS DISTINCT FROM NEW.data_inicio
)
EXECUTE FUNCTION f_pdm_refresh_meta_trigger();

-- removidos: o app nunca troca o pai, e meta_orgao/equipe/orçamento já são cobertos ou não são lidos pelo refresh
DROP TRIGGER IF EXISTS trg_refresh_meta_iniciativa ON iniciativa;
DROP TRIGGER IF EXISTS trg_refresh_meta_atividade ON atividade;
DROP TRIGGER IF EXISTS trg_refresh_meta_meta_orgao ON meta_orgao;
DROP TRIGGER IF EXISTS trg_refresh_meta_grupo_responsavel_equipe ON grupo_responsavel_equipe;
DROP TRIGGER IF EXISTS trg_refresh_meta_pdm_orcamento_config ON meta_orcamento_config;
DROP FUNCTION IF EXISTS f_iniciativa_refresh_meta_trigger();
DROP FUNCTION IF EXISTS f_atividade_refresh_meta_trigger();
DROP FUNCTION IF EXISTS f_meta_orgao_refresh_meta_trigger();
DROP FUNCTION IF EXISTS f_grupo_responsavel_equipe_refresh_meta_trigger();
DROP FUNCTION IF EXISTS f_pdm_orcamento_config_refresh_meta_trigger();
