CREATE OR REPLACE FUNCTION f_projeto_fonte_recurso_percentual(p_valor_nominal double precision, p_projeto_id int)
    RETURNS double precision
    AS $$
    SELECT p_valor_nominal / NULLIF((
        SELECT tc.previsao_custo
        FROM tarefa_cronograma tc
        WHERE tc.projeto_id = p_projeto_id
        AND tc.removido_em IS NULL
        ORDER BY tc.id
        LIMIT 1
    ), 0) * 100;
$$
LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION f_trg_projeto_fonte_recurso_percentual() RETURNS trigger AS $$
BEGIN
    NEW.valor_percentual := f_projeto_fonte_recurso_percentual(NEW.valor_nominal, NEW.projeto_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projeto_fonte_recurso_percentual ON projeto_fonte_recurso;
CREATE TRIGGER trg_projeto_fonte_recurso_percentual
    BEFORE INSERT OR UPDATE ON projeto_fonte_recurso
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_projeto_fonte_recurso_percentual();

CREATE OR REPLACE FUNCTION f_trg_tarefa_cronograma_recalc_fonte_percentual() RETURNS trigger AS $$
BEGIN
    UPDATE projeto_fonte_recurso pfr
    SET valor_percentual = f_projeto_fonte_recurso_percentual(pfr.valor_nominal, pfr.projeto_id)
    WHERE pfr.projeto_id IN (
        NEW.projeto_id,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.projeto_id END
    )
    AND pfr.valor_percentual IS DISTINCT FROM f_projeto_fonte_recurso_percentual(pfr.valor_nominal, pfr.projeto_id);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tarefa_cronograma_recalc_fonte_percentual_insert ON tarefa_cronograma;
CREATE TRIGGER trg_tarefa_cronograma_recalc_fonte_percentual_insert
    AFTER INSERT ON tarefa_cronograma
    FOR EACH ROW
    WHEN (NEW.projeto_id IS NOT NULL)
    EXECUTE FUNCTION f_trg_tarefa_cronograma_recalc_fonte_percentual();

DROP TRIGGER IF EXISTS trg_tarefa_cronograma_recalc_fonte_percentual_update ON tarefa_cronograma;
CREATE TRIGGER trg_tarefa_cronograma_recalc_fonte_percentual_update
    AFTER UPDATE ON tarefa_cronograma
    FOR EACH ROW
    WHEN (
        (NEW.projeto_id IS NOT NULL OR OLD.projeto_id IS NOT NULL) AND (
            OLD.previsao_custo IS DISTINCT FROM NEW.previsao_custo OR
            OLD.removido_em IS DISTINCT FROM NEW.removido_em OR
            OLD.projeto_id IS DISTINCT FROM NEW.projeto_id
        )
    )
    EXECUTE FUNCTION f_trg_tarefa_cronograma_recalc_fonte_percentual();

UPDATE projeto_fonte_recurso
SET valor_percentual = f_projeto_fonte_recurso_percentual(valor_nominal, projeto_id)
WHERE valor_percentual IS DISTINCT FROM f_projeto_fonte_recurso_percentual(valor_nominal, projeto_id);
