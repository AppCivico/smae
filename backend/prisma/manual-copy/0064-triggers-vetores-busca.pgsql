CREATE OR REPLACE FUNCTION f_orgao_rebuild_transferencia_vetores_busca() RETURNS TRIGGER AS $$
BEGIN
    UPDATE transferencia
    SET vetores_busca = f_rebuild_transferencia_tsvector(id)
    WHERE removido_em IS NULL
    AND id IN (
        SELECT t.id FROM transferencia t
        WHERE t.orgao_concedente_id = NEW.id OR t.secretaria_concedente_id = NEW.id
        UNION
        SELECT dr.transferencia_id FROM distribuicao_recurso dr
        WHERE dr.orgao_gestor_id = NEW.id AND dr.removido_em IS NULL
    );

    RETURN NULL;
END
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_orgao_rebuild_transferencia_vetores_busca ON orgao;
CREATE TRIGGER trigger_orgao_rebuild_transferencia_vetores_busca
    AFTER UPDATE OF sigla, descricao ON orgao
    FOR EACH ROW
    WHEN (
        OLD.sigla IS DISTINCT FROM NEW.sigla OR
        OLD.descricao IS DISTINCT FROM NEW.descricao
    )
    EXECUTE FUNCTION f_orgao_rebuild_transferencia_vetores_busca();

CREATE OR REPLACE FUNCTION f_transferencia_tipo_rebuild_vetores_busca() RETURNS TRIGGER AS $$
BEGIN
    UPDATE transferencia
    SET vetores_busca = f_rebuild_transferencia_tsvector(id)
    WHERE removido_em IS NULL
    AND tipo_id = NEW.id;

    RETURN NULL;
END
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_transferencia_tipo_rebuild_vetores_busca ON transferencia_tipo;
CREATE TRIGGER trigger_transferencia_tipo_rebuild_vetores_busca
    AFTER UPDATE OF nome ON transferencia_tipo
    FOR EACH ROW
    WHEN (OLD.nome IS DISTINCT FROM NEW.nome)
    EXECUTE FUNCTION f_transferencia_tipo_rebuild_vetores_busca();

CREATE OR REPLACE FUNCTION f_partido_rebuild_transferencia_vetores_busca() RETURNS TRIGGER AS $$
BEGIN
    UPDATE transferencia
    SET vetores_busca = f_rebuild_transferencia_tsvector(id)
    WHERE removido_em IS NULL
    AND id IN (
        SELECT tp.transferencia_id FROM transferencia_parlamentar tp
        WHERE tp.partido_id = NEW.id AND tp.removido_em IS NULL
    );

    RETURN NULL;
END
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_partido_rebuild_transferencia_vetores_busca ON partido;
CREATE TRIGGER trigger_partido_rebuild_transferencia_vetores_busca
    AFTER UPDATE OF sigla ON partido
    FOR EACH ROW
    WHEN (OLD.sigla IS DISTINCT FROM NEW.sigla)
    EXECUTE FUNCTION f_partido_rebuild_transferencia_vetores_busca();

CREATE OR REPLACE FUNCTION f_parlamentar_rebuild_transferencia_vetores_busca() RETURNS TRIGGER AS $$
BEGIN
    UPDATE transferencia
    SET vetores_busca = f_rebuild_transferencia_tsvector(id)
    WHERE removido_em IS NULL
    AND id IN (
        SELECT tp.transferencia_id FROM transferencia_parlamentar tp
        WHERE tp.parlamentar_id = NEW.id AND tp.removido_em IS NULL
    );

    RETURN NULL;
END
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_parlamentar_rebuild_transferencia_vetores_busca ON parlamentar;
CREATE TRIGGER trigger_parlamentar_rebuild_transferencia_vetores_busca
    AFTER UPDATE OF nome, nome_popular ON parlamentar
    FOR EACH ROW
    WHEN (
        OLD.nome IS DISTINCT FROM NEW.nome OR
        OLD.nome_popular IS DISTINCT FROM NEW.nome_popular
    )
    EXECUTE FUNCTION f_parlamentar_rebuild_transferencia_vetores_busca();

CREATE OR REPLACE FUNCTION f_partido_rebuild_parlamentar_vetores_busca() RETURNS TRIGGER AS $$
BEGIN
    -- vetores_busca NULL faz o tsvector_parlamentar_update recalcular o vetor
    UPDATE parlamentar
    SET vetores_busca = NULL
    WHERE id IN (
        SELECT pm.parlamentar_id FROM parlamentar_mandato pm
        WHERE pm.partido_candidatura_id = NEW.id AND pm.removido_em IS NULL
    );

    RETURN NULL;
END
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_partido_rebuild_parlamentar_vetores_busca ON partido;
CREATE TRIGGER trigger_partido_rebuild_parlamentar_vetores_busca
    AFTER UPDATE OF nome, sigla ON partido
    FOR EACH ROW
    WHEN (
        OLD.nome IS DISTINCT FROM NEW.nome OR
        OLD.sigla IS DISTINCT FROM NEW.sigla
    )
    EXECUTE FUNCTION f_partido_rebuild_parlamentar_vetores_busca();
