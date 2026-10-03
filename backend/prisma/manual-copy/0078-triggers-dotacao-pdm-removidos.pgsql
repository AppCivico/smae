CREATE OR REPLACE FUNCTION f_tgr_iniciativa_removida_recalc_dotacao_pdm()
    RETURNS TRIGGER
    AS $$
BEGIN
    UPDATE dotacao_planejado d
    SET id = d.id
    WHERE (d.ano_referencia, d.dotacao) IN (
        SELECT op.ano_referencia, op.dotacao
        FROM orcamento_planejado op
        WHERE op.iniciativa_id = NEW.id
        AND op.removido_em IS NULL
    );

    UPDATE orcamento_realizado r
    SET id = r.id
    WHERE r.id IN (
        SELECT DISTINCT ON (o.ano_referencia, o.dotacao, o.processo, o.nota_empenho) o.id
        FROM orcamento_realizado o
        WHERE o.iniciativa_id = NEW.id
        AND o.removido_em IS NULL
        ORDER BY o.ano_referencia, o.dotacao, o.processo, o.nota_empenho, o.id
    );

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_iniciativa_removida_recalc_dotacao_pdm ON iniciativa;
CREATE TRIGGER tgr_iniciativa_removida_recalc_dotacao_pdm
    AFTER UPDATE OF removido_em ON iniciativa
    FOR EACH ROW
    WHEN (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    EXECUTE FUNCTION f_tgr_iniciativa_removida_recalc_dotacao_pdm();

CREATE OR REPLACE FUNCTION f_tgr_atividade_removida_recalc_dotacao_pdm()
    RETURNS TRIGGER
    AS $$
BEGIN
    UPDATE dotacao_planejado d
    SET id = d.id
    WHERE (d.ano_referencia, d.dotacao) IN (
        SELECT op.ano_referencia, op.dotacao
        FROM orcamento_planejado op
        WHERE op.atividade_id = NEW.id
        AND op.removido_em IS NULL
    );

    UPDATE orcamento_realizado r
    SET id = r.id
    WHERE r.id IN (
        SELECT DISTINCT ON (o.ano_referencia, o.dotacao, o.processo, o.nota_empenho) o.id
        FROM orcamento_realizado o
        WHERE o.atividade_id = NEW.id
        AND o.removido_em IS NULL
        ORDER BY o.ano_referencia, o.dotacao, o.processo, o.nota_empenho, o.id
    );

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_atividade_removida_recalc_dotacao_pdm ON atividade;
CREATE TRIGGER tgr_atividade_removida_recalc_dotacao_pdm
    AFTER UPDATE OF removido_em ON atividade
    FOR EACH ROW
    WHEN (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    EXECUTE FUNCTION f_tgr_atividade_removida_recalc_dotacao_pdm();

-- meta removida: as somas do 0034 já ignoram meta removida, mas só são refeitas quando a linha de orçamento é gravada
CREATE OR REPLACE FUNCTION f_tgr_meta_removida_recalc_dotacao_pdm()
    RETURNS TRIGGER
    AS $$
BEGIN
    UPDATE dotacao_planejado d
    SET id = d.id
    WHERE (d.ano_referencia, d.dotacao) IN (
        SELECT op.ano_referencia, op.dotacao
        FROM orcamento_planejado op
        WHERE op.meta_id = NEW.id
        AND op.removido_em IS NULL
    );

    UPDATE orcamento_realizado r
    SET id = r.id
    WHERE r.id IN (
        SELECT DISTINCT ON (o.ano_referencia, o.dotacao, o.processo, o.nota_empenho) o.id
        FROM orcamento_realizado o
        WHERE o.meta_id = NEW.id
        AND o.removido_em IS NULL
        ORDER BY o.ano_referencia, o.dotacao, o.processo, o.nota_empenho, o.id
    );

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_meta_removida_recalc_dotacao_pdm ON meta;
CREATE TRIGGER tgr_meta_removida_recalc_dotacao_pdm
    AFTER UPDATE OF removido_em ON meta
    FOR EACH ROW
    WHEN (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    EXECUTE FUNCTION f_tgr_meta_removida_recalc_dotacao_pdm();
