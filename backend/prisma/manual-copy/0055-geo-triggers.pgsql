-- Função para calcular e popular os arrays de regiões para uma geo_localizacao
CREATE OR REPLACE FUNCTION calc_geo_localizacao_regioes(p_geo_localizacao_id INTEGER)
RETURNS void AS $$
DECLARE
    v_regioes_nivel_1 INTEGER[];
    v_regioes_nivel_2 INTEGER[];
    v_regioes_nivel_3 INTEGER[];
    v_regioes_nivel_4 INTEGER[];
BEGIN
    WITH RECURSIVE
    -- Primeiro, obter todas as regiões diretamente vinculadas às camadas desta geo_localizacao
    direct_regions AS (
        SELECT DISTINCT r.id, r.nivel, r.parente_id
        FROM geo_localizacao_camada glc
        JOIN geo_camada_regiao gcr ON gcr.geo_camada_id = glc.geo_camada_id
        JOIN regiao r ON r.id = gcr.regiao_id AND r.removido_em IS NULL
        WHERE glc.geo_localizacao_id = p_geo_localizacao_id
    ),
    -- Recursivamente encontrar todos os ancestrais (caminhar PARA CIMA na árvore)
    all_regions AS (
        SELECT id, nivel, parente_id
        FROM direct_regions

        UNION

        SELECT r.id, r.nivel, r.parente_id
        FROM regiao r
        INNER JOIN all_regions ar ON r.id = ar.parente_id
        WHERE r.removido_em IS NULL
    )
    SELECT
        COALESCE(array_agg(DISTINCT id) FILTER (WHERE nivel = 1), ARRAY[]::INTEGER[]),
        COALESCE(array_agg(DISTINCT id) FILTER (WHERE nivel = 2), ARRAY[]::INTEGER[]),
        COALESCE(array_agg(DISTINCT id) FILTER (WHERE nivel = 3), ARRAY[]::INTEGER[]),
        COALESCE(array_agg(DISTINCT id) FILTER (WHERE nivel = 4), ARRAY[]::INTEGER[])
    INTO v_regioes_nivel_1, v_regioes_nivel_2, v_regioes_nivel_3, v_regioes_nivel_4
    FROM all_regions;

    UPDATE geo_localizacao
    SET
        calc_regioes_nivel_1 = v_regioes_nivel_1,
        calc_regioes_nivel_2 = v_regioes_nivel_2,
        calc_regioes_nivel_3 = v_regioes_nivel_3,
        calc_regioes_nivel_4 = v_regioes_nivel_4
    WHERE id = p_geo_localizacao_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GATILHO 1: mudanças em geo_localizacao_camada
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_geo_localizacao_camada_update_regioes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calc_geo_localizacao_regioes(OLD.geo_localizacao_id);
        RETURN OLD;
    ELSE
        PERFORM calc_geo_localizacao_regioes(NEW.geo_localizacao_id);
        -- Lidar com UPDATE onde geo_localizacao_id mudou
        IF TG_OP = 'UPDATE' AND OLD.geo_localizacao_id IS DISTINCT FROM NEW.geo_localizacao_id THEN
            PERFORM calc_geo_localizacao_regioes(OLD.geo_localizacao_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_geo_localizacao_camada_regioes ON geo_localizacao_camada;
CREATE TRIGGER trg_geo_localizacao_camada_regioes
AFTER INSERT OR UPDATE OR DELETE ON geo_localizacao_camada
FOR EACH ROW
EXECUTE FUNCTION trg_geo_localizacao_camada_update_regioes();

-- ============================================================================
-- GATILHO 2: mudanças em geo_camada_regiao
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_geo_camada_regiao_update_regioes()
RETURNS TRIGGER AS $$
DECLARE
    v_camada_id INTEGER;
BEGIN
    v_camada_id := COALESCE(NEW.geo_camada_id, OLD.geo_camada_id);

    -- Recalcular todas as geo_localizacoes que usam esta camada
    PERFORM calc_geo_localizacao_regioes(glc.geo_localizacao_id)
    FROM geo_localizacao_camada glc
    WHERE glc.geo_camada_id = v_camada_id;

    -- Lidar com UPDATE onde geo_camada_id mudou
    IF TG_OP = 'UPDATE' AND OLD.geo_camada_id IS DISTINCT FROM NEW.geo_camada_id THEN
        PERFORM calc_geo_localizacao_regioes(glc.geo_localizacao_id)
        FROM geo_localizacao_camada glc
        WHERE glc.geo_camada_id = OLD.geo_camada_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_geo_camada_regiao_regioes ON geo_camada_regiao;
CREATE TRIGGER trg_geo_camada_regiao_regioes
AFTER INSERT OR UPDATE OR DELETE ON geo_camada_regiao
FOR EACH ROW
EXECUTE FUNCTION trg_geo_camada_regiao_update_regioes();

-- ============================================================================
-- GATILHO 3: mudanças em regiao (hierarquia ou exclusão suave)
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_regiao_update_geo_regioes()
RETURNS TRIGGER AS $$
BEGIN
    -- Só importa para: mudança em parente_id, mudança em nivel, ou exclusão suave (removido_em)
    IF TG_OP = 'UPDATE' AND
       OLD.parente_id IS NOT DISTINCT FROM NEW.parente_id AND
       OLD.nivel IS NOT DISTINCT FROM NEW.nivel AND
       OLD.removido_em IS NOT DISTINCT FROM NEW.removido_em THEN
        -- Nada relevante mudou
        RETURN NEW;
    END IF;

    -- Encontrar todas as geo_localizacoes afetadas por esta mudança de região
    -- Isso inclui:
    -- 1. Localizações diretamente vinculadas a camadas que referenciam esta região
    -- 2. Localizações vinculadas a camadas que referenciam FILHOS desta região
    --    (porque caminhamos PARA CIMA, o cálculo dos filhos depende deste pai)

    WITH RECURSIVE
    affected_regions AS (
        -- Esta região
        SELECT COALESCE(NEW.id, OLD.id) AS id

        UNION

        -- Todos os descendentes (filhos dependem desta região como ancestral)
        SELECT r.id
        FROM regiao r
        INNER JOIN affected_regions ar ON r.parente_id = ar.id
        WHERE r.removido_em IS NULL
    ),
    affected_camadas AS (
        SELECT DISTINCT gcr.geo_camada_id
        FROM geo_camada_regiao gcr
        WHERE gcr.regiao_id IN (SELECT id FROM affected_regions)
    ),
    affected_locations AS (
        SELECT DISTINCT glc.geo_localizacao_id
        FROM geo_localizacao_camada glc
        WHERE glc.geo_camada_id IN (SELECT geo_camada_id FROM affected_camadas)
    )
    -- Recalcular cada localização afetada
    SELECT calc_geo_localizacao_regioes(geo_localizacao_id)
    FROM affected_locations;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_regiao_geo_regioes ON regiao;
CREATE TRIGGER trg_regiao_geo_regioes
AFTER UPDATE ON regiao
FOR EACH ROW
EXECUTE FUNCTION trg_regiao_update_geo_regioes();

-- ============================================================================
-- MIGRAÇÃO: Popular registros existentes
-- ============================================================================
DO $$
DECLARE
    v_id INTEGER;
    v_count INTEGER := 0;
BEGIN
    FOR v_id IN SELECT id FROM geo_localizacao
    LOOP
        PERFORM calc_geo_localizacao_regioes(v_id);
        v_count := v_count + 1;
        IF v_count % 1000 = 0 THEN
            RAISE NOTICE 'Processados % registros geo_localizacao', v_count;
        END IF;
    END LOOP;
    RAISE NOTICE 'Finalizado o processamento de % registros geo_localizacao', v_count;
END;
$$;
