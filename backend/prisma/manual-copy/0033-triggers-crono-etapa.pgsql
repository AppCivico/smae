CREATE OR REPLACE FUNCTION atualiza_inicio_fim_cronograma (pCronoId int)
    RETURNS varchar
    AS $$
DECLARE
    v_inicio_previsto date;
    v_inicio_real date;
    v_termino_previsto date;
    v_termino_real date;
BEGIN

    SELECT
        min(inicio_previsto),
        min(inicio_real) filter (where inicio_real is not null)
        into v_inicio_previsto, v_inicio_real
    FROM cronograma_etapa ce
    JOIN etapa e ON
        e.id = ce.etapa_id
        and e.removido_em is null
    WHERE ce.cronograma_id = pCronoId
    and ce.inativo = false; -- conferir com o Lucas

    SELECT
        max(termino_previsto)
        into v_termino_previsto
    FROM cronograma_etapa ce
    JOIN etapa e ON
        e.id = ce.etapa_id
        and e.removido_em is null
        and e.etapa_pai_id is null
    WHERE ce.cronograma_id = pCronoId
    and ce.inativo = false
    and (
           SELECT count(1)
           FROM cronograma_etapa ce
           JOIN etapa e ON
                e.id = ce.etapa_id
                and e.removido_em is null
                and e.etapa_pai_id is null
           WHERE ce.cronograma_id = pCronoId
           AND ce.inativo = false
           AND e.termino_previsto IS NULL
    ) = 0;

    SELECT
        max(termino_real)
        into v_termino_real
    FROM cronograma_etapa ce
    JOIN etapa e ON
        e.id = ce.etapa_id
        and e.removido_em is null
        and e.etapa_pai_id is null
    WHERE ce.cronograma_id = pCronoId
    and ce.inativo = false
    and (
           SELECT count(1)
           FROM cronograma_etapa ce
           JOIN etapa e ON
                e.id = ce.etapa_id
                and e.removido_em is null
                and e.etapa_pai_id is null
           WHERE ce.cronograma_id = pCronoId
           AND ce.inativo = false
           AND e.termino_real IS NULL
    ) = 0;

    UPDATE cronograma
    SET
    inicio_previsto = v_inicio_previsto,
    inicio_real = v_inicio_real,
    termino_previsto = v_termino_previsto,
    termino_real = v_termino_real
    WHERE id = pCronoId
    AND (
        (inicio_previsto IS DISTINCT FROM v_inicio_previsto) OR
        (inicio_real IS DISTINCT FROM v_inicio_real) OR
        (termino_previsto IS DISTINCT FROM v_termino_previsto) OR
        (termino_real IS DISTINCT FROM v_termino_real)
    );

    return '';
END
$$
LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION f_trg_estapa_esticar_datas_do_pai() RETURNS trigger AS $emp_stamp$
DECLARE
    v_termino_previsto date;
    v_termino_real date;
    v_inicio_previsto date;
    v_inicio_real date;

    count_filhos INTEGER;
BEGIN

    -- apenas em modificações de etapas (e nao fases e subfases)
    -- buscar quais cronogramas a etapa está associada, e então recalcular um por um
    IF NEW.etapa_pai_id IS NULL THEN
        PERFORM  atualiza_inicio_fim_cronograma(sub.cronograma_id)
            FROM (
                select ce.cronograma_id
                FROM cronograma_etapa ce
                WHERE ce.etapa_id = NEW.id
                GROUP BY 1
            ) sub;
    END IF;

    -- fase e subfases
    IF NEW.etapa_pai_id IS NOT NULL THEN

        SELECT MIN(ef.inicio_previsto) INTO v_inicio_previsto
        FROM etapa ef
        WHERE ef.etapa_pai_id = NEW.etapa_pai_id
          AND ef.removido_em IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM etapa ef2
            WHERE ef2.etapa_pai_id = NEW.etapa_pai_id
              AND ef2.inicio_previsto IS NULL
              AND ef2.removido_em IS NULL
        );

        SELECT MIN(ef.inicio_real) INTO v_inicio_real
        FROM etapa ef
        WHERE ef.etapa_pai_id = NEW.etapa_pai_id
          AND ef.removido_em IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM etapa ef2
            WHERE ef2.etapa_pai_id = NEW.etapa_pai_id
              AND ef2.inicio_real IS NULL
              AND ef2.removido_em IS NULL
        );

        -- sempre recalcula o termino_previsto de acordo com a situacao atual
        SELECT MAX(ef.termino_previsto) INTO v_termino_previsto
        FROM etapa ef
        WHERE ef.etapa_pai_id = NEW.etapa_pai_id
          AND ef.removido_em IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM etapa ef2
            WHERE ef2.etapa_pai_id = NEW.etapa_pai_id
              AND ef2.termino_previsto IS NULL
              AND ef2.removido_em IS NULL
          );

        SELECT MAX(ef.termino_real) INTO v_termino_real
        FROM etapa ef
        WHERE ef.etapa_pai_id = NEW.etapa_pai_id
          AND ef.removido_em IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM etapa ef2
            WHERE ef2.etapa_pai_id = NEW.etapa_pai_id
              AND ef2.termino_real IS NULL
              AND ef2.removido_em IS NULL
          );

        UPDATE etapa e
        SET termino_previsto = v_termino_previsto,
            termino_real = v_termino_real,
            inicio_real = v_inicio_real,
            inicio_previsto = v_inicio_previsto
        WHERE e.id = NEW.etapa_pai_id
        AND (
            (termino_previsto IS DISTINCT FROM v_termino_previsto) OR
            (termino_real IS DISTINCT FROM v_termino_real) OR
            (inicio_real IS DISTINCT FROM v_inicio_real) OR
            (inicio_previsto IS DISTINCT FROM v_inicio_previsto)
        );

    END IF;
    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;

-- comentado mas isso aqui ta vivo, é usado, só n deve rodar sempre
-- CREATE TRIGGER trg_estapa_esticar_datas_do_pai AFTER INSERT ON etapa
--     FOR EACH ROW
--     EXECUTE FUNCTION f_trg_estapa_esticar_datas_do_pai();
--
-- CREATE TRIGGER trg_estapa_esticar_datas_do_pai_update AFTER  UPDATE ON etapa
--     FOR EACH ROW
--     WHEN (
--         (OLD.inicio_previsto IS DISTINCT FROM NEW.inicio_previsto)
--         OR
--         (OLD.termino_previsto IS DISTINCT FROM NEW.termino_previsto)
--         OR
--         (OLD.inicio_real IS DISTINCT FROM NEW.inicio_real)
--         OR
--         (OLD.termino_real IS DISTINCT FROM NEW.termino_real)
--         OR
--         (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
--     )
--     EXECUTE FUNCTION f_trg_estapa_esticar_datas_do_pai();
--
-- CREATE OR REPLACE FUNCTION f_trg_crono_estapa_resync() RETURNS trigger AS $emp_stamp$
-- BEGIN
--     PERFORM  atualiza_inicio_fim_cronograma(NEW.cronograma_id);
--     RETURN NEW;
-- END;
-- $emp_stamp$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER trg_estapa_esticar_datas_do_pai AFTER INSERT OR DELETE OR UPDATE ON cronograma_etapa
--     FOR EACH ROW
--     EXECUTE FUNCTION f_trg_crono_estapa_resync();
--
-- WITH RECURSIVE etapa_hierarchy AS (
--   SELECT id, etapa_pai_id
--   FROM etapa
--   WHERE etapa_pai_id IS NULL
--   UNION ALL
--   SELECT e.id, e.etapa_pai_id
--   FROM etapa e
--   INNER JOIN etapa_hierarchy eh ON e.etapa_pai_id = eh.id
-- )
-- UPDATE etapa e
-- SET n_filhos_imediatos = (
--   SELECT COUNT(*)
--   FROM etapa_hierarchy eh
--   WHERE eh.etapa_pai_id = e.id
-- )
-- WHERE n_filhos_imediatos IS NULL;

/* - removendo
CREATE OR REPLACE FUNCTION increment_n_filhos_imediatos()
  RETURNS TRIGGER AS
$$
BEGIN
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

drop trigger increment_n_filhos_imediatos_trigger on etapa;



*/

CREATE OR REPLACE FUNCTION update_n_filhos_imediatos()
RETURNS TRIGGER AS $$
DECLARE
    parent_id integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        parent_id := NEW.etapa_pai_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.removido_em IS NULL AND OLD.removido_em IS NOT NULL THEN
            parent_id := NEW.etapa_pai_id;
        ELSIF NEW.removido_em IS NOT NULL AND OLD.removido_em IS NULL THEN
            parent_id := OLD.etapa_pai_id;
        ELSE
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        parent_id := OLD.etapa_pai_id;
    END IF;

    UPDATE etapa
    SET n_filhos_imediatos = (
        SELECT COUNT(*)
        FROM etapa c
        WHERE c.etapa_pai_id = etapa.id
        AND c.removido_em IS NULL
    )
    WHERE id = parent_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--CREATE TRIGGER trg_update_n_filhos_imediatos
--AFTER INSERT OR UPDATE OR DELETE ON etapa
--FOR EACH ROW
--EXECUTE PROCEDURE update_n_filhos_imediatos();


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

    IF (NEW.percentual_execucao <> OLD.percentual_execucao OR NEW.peso <> OLD.peso OR NEW.removido_em IS NOT NULL) OR TG_OP = 'INSERT' THEN
        parent_id := NEW.etapa_pai_id;
        WHILE parent_id IS NOT NULL LOOP
            PERFORM calculate_percentual_execucao_for_id(parent_id);
            parent_id := (SELECT etapa_pai_id FROM etapa WHERE id = parent_id AND removido_em IS NULL);
        END LOOP;
        PERFORM calculate_percentual_execucao_for_id(NEW.cronograma_id, true::BOOLEAN);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--CREATE TRIGGER trg_calculate_percentual_execucao
--AFTER INSERT OR UPDATE ON etapa
--FOR EACH ROW
--EXECUTE FUNCTION calculate_percentual_execucao_trigger();

CREATE OR REPLACE FUNCTION assert_geoloc_rule(e_id INTEGER, c_id INTEGER)
RETURNS record
AS $$
DECLARE
    rec record;
BEGIN
    SELECT
        CASE WHEN
            EXISTS (
                SELECT 1 FROM etapa WHERE etapa.id = e2.id AND etapa.endereco_obrigatorio = true AND NOT EXISTS (SELECT 1 FROM geo_localizacao_referencia WHERE removido_em IS NULL AND etapa_id = e2.id)
            )
        THEN e2.titulo ELSE NULL END as e2_titulo,
        CASE WHEN
            EXISTS (
                SELECT 1 FROM etapa WHERE etapa.id = e3.id AND etapa.endereco_obrigatorio = true AND NOT EXISTS (SELECT 1 FROM geo_localizacao_referencia WHERE removido_em IS NULL AND etapa_id = e3.id)
            )
        THEN e3.titulo ELSE NULL END as e3_titulo
    INTO rec
    FROM cronograma_etapa ce1
    JOIN etapa e1 ON ce1.etapa_id = e1.id
    LEFT JOIN etapa e2 ON e2.id = e1.etapa_pai_id AND e2.removido_em IS NULL
    LEFT JOIN etapa e3 ON e3.id = e2.etapa_pai_id AND e3.removido_em IS NULL
    WHERE
        ce1.etapa_id = e_id AND ce1.cronograma_id = c_id;

    RETURN rec;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE proc_sync_serie_variavel(
    pVariavelId INT,
    pSerie "Serie",
    pData DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_added BOOLEAN;
    valor_nominal DECIMAL;
    currentDate DATE;
    v_record RECORD;

    v_cat_sim INT;
    v_cat_nao INT;
    v_cat_id INT;

    _debug VARCHAR;

    v_acumulativa BOOLEAN; -- em teoria sempre é, mas just in case
    v_variavel_categorica_valor_id INT;

BEGIN

    SELECT
        v.variavel_categorica_id,
        vs.id,
        vn.id,
        v.acumulativa
    INTO
        v_cat_id,
        v_cat_sim,
        v_cat_nao,
        v_acumulativa
    FROM variavel v
    JOIN variavel_categorica_valor vs on v.variavel_categorica_id = vs.variavel_categorica_id and vs.valor_variavel = 1
    JOIN variavel_categorica_valor vn on v.variavel_categorica_id = vn.variavel_categorica_id and vn.valor_variavel = 0
    WHERE v.id = pVariavelId;

    IF (v_cat_id IS NULL) THEN
        RAISE EXCEPTION 'Variavel id % não é categórica', pVariavelId;
    END IF;

    -- Delete tudo para a serie
    DELETE FROM serie_variavel
    WHERE variavel_id = pVariavelId
    AND serie = pSerie;

    v_added := FALSE;
    -- pega min/max e o periodo

    FOR v_record IN
        SELECT * FROM busca_periodos_variavel(pVariavelId)
    LOOP
        --raise notice 'v_record: %', v_record;

        currentDate := v_record.min;

        WHILE currentDate <= v_record.max LOOP

            IF currentDate < date_trunc('month', pData) THEN
                valor_nominal := 0;
                v_variavel_categorica_valor_id := v_cat_nao;
            ELSIF currentDate >= date_trunc('month', pData) AND v_added = FALSE THEN
                valor_nominal := 1;
                v_variavel_categorica_valor_id := v_cat_sim;
                v_added := true;
            ELSIF currentDate <= date_trunc('month', CURRENT_DATE)  THEN
                valor_nominal := 0;
                v_variavel_categorica_valor_id := v_cat_nao;
            ELSE
                EXIT;
            END IF;

            INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal, variavel_categorica_valor_id, variavel_categorica_id)
            VALUES (pVariavelId, pSerie, currentDate, valor_nominal, v_variavel_categorica_valor_id, v_cat_id);

            currentDate := currentDate + v_record.periodicidade;
        END LOOP;
    END LOOP;

    IF (v_acumulativa) THEN

        select monta_serie_acumulada(pVariavelId, pSerie = 'Realizado'::"Serie") into _debug;

    END IF;

    FOR v_record IN
        SELECT indicador_id FROM mv_variavel_pdm WHERE variavel_id = pVariavelId
    LOOP
        SELECT refresh_serie_indicador(v_record.indicador_id, '{}'::jsonb) into _debug;
    END LOOP;

END;
$$;

CREATE OR REPLACE FUNCTION f_private_troca_regiao_variavel_na_troca_da_etapa(
    _variavel_id INT,
    _regiao_id INT
)
RETURNS BOOLEAN AS $$
DECLARE
    _regionalizavel BOOLEAN;
    _nivel_regionalizacao INT;
    _nivel_regiao INT;

    rows_affected int;
BEGIN
    UPDATE variavel
    SET regiao_id = _regiao_id
    WHERE id = _variavel_id AND regiao_id IS DISTINCT FROM _regiao_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;

    SELECT
        i.regionalizavel,
        i.nivel_regionalizacao,
        r.nivel as nivel_regiao
        into
        _regionalizavel,
        _nivel_regionalizacao,
        _nivel_regiao
    FROM indicador i
    JOIN indicador_variavel iv ON iv.indicador_id = i.id
    JOIN regiao r ON r.id = _regiao_id
    WHERE iv.variavel_id = _variavel_id;

    IF (_regionalizavel AND _nivel_regionalizacao > _nivel_regiao) THEN
        RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
            'message', 'A região da etapa não é suficiente para o indicador associado à variável',
            'code', 400
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION f_tgr_atualiza_variavel_na_troca_da_etapa()
RETURNS TRIGGER AS $$
DECLARE
    v_inserida_agora BOOLEAN;
BEGIN
    -- Inicializa a flag que indica se uma variável foi associada à etapa nesta operação
    v_inserida_agora := false;

    -- Verifica a operação realizada na tabela etapa
    IF TG_OP = 'INSERT' THEN
        -- Se for uma inserção, não permite associar variável
        IF NEW.variavel_id IS NOT NULL THEN
            RAISE EXCEPTION 'Não é possível associar uma variável a uma etapa no momento da criação da etapa';
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN

        -- Se for uma atualização, verifica se a variável associada foi alterada
        IF OLD.variavel_id IS DISTINCT FROM NEW.variavel_id OR OLD.removido_em IS DISTINCT FROM NEW.removido_em THEN
            -- Se a variável foi removida (definida como NULL)
            -- ou tbm se a etapa foi removida
            -- se fizer o restore, vai precisar voltar manualmente a variavel
            IF NEW.variavel_id IS NULL OR NEW.removido_em IS NOT NULL THEN
                -- Define a variável como removida
                UPDATE variavel
                SET removido_em = NOW()
                WHERE id = OLD.variavel_id AND removido_em IS NULL;

            -- Se uma nova variável foi associada
            ELSE
                -- Atualiza a região da variável, se necessário
                IF NOT f_private_troca_regiao_variavel_na_troca_da_etapa(NEW.variavel_id, NEW.regiao_id) THEN
                    RAISE EXCEPTION 'Erro interno';
                END IF;

                -- Verifica se a variável já está associada a outra etapa
                IF EXISTS (
                    SELECT 1
                    FROM variavel v
                    JOIN etapa e ON e.variavel_id = v.id
                    WHERE v.id = NEW.variavel_id
                    AND e.removido_em IS NULL
                    AND e.id <> NEW.id
                ) THEN
                    RAISE EXCEPTION 'A variável já está associada a outra etapa';
                END IF;

                -- Sincroniza as séries da variável com base nas datas da etapa
                CALL proc_sync_serie_variavel(NEW.variavel_id, 'Previsto'::"Serie", NEW.termino_previsto);
                CALL proc_sync_serie_variavel(NEW.variavel_id, 'Realizado'::"Serie", NEW.termino_real);

                v_inserida_agora := true;
            END IF;

        -- Se a região da etapa foi alterada
        ELSIF OLD.regiao_id IS DISTINCT FROM NEW.regiao_id THEN
            -- Atualiza a região da variável
            IF NOT f_private_troca_regiao_variavel_na_troca_da_etapa(NEW.variavel_id, NEW.regiao_id) THEN
                RAISE EXCEPTION 'Erro interno';
            END IF;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        -- Se havia uma variável associada à etapa, não deveria apagar dessa forma, though
        IF OLD.variavel_id IS NOT NULL THEN
            -- Define a variável como removida
            UPDATE variavel
            SET removido_em = NOW()
            WHERE id = OLD.variavel_id AND removido_em IS NULL;
        END IF;
    END IF;

    -- Se for uma atualização e uma nova variável NÃO foi associada nesta operação
    IF TG_OP = 'UPDATE' AND v_inserida_agora = FALSE AND NEW.variavel_id IS NOT NULL THEN
        -- Se a data de término prevista foi alterada
        IF OLD.termino_previsto IS DISTINCT FROM NEW.termino_previsto THEN
            CALL proc_sync_serie_variavel(NEW.variavel_id, 'Previsto'::"Serie", NEW.termino_previsto);
        END IF;

        -- Se a data de término real foi alterada
        IF OLD.termino_real IS DISTINCT FROM NEW.termino_real THEN
            CALL proc_sync_serie_variavel(NEW.variavel_id, 'Realizado'::"Serie", NEW.termino_real);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--CREATE TRIGGER etapa_update_variavel
--BEFORE INSERT OR UPDATE OR DELETE ON etapa
--FOR EACH ROW
--EXECUTE PROCEDURE f_tgr_atualiza_variavel_na_troca_da_etapa();
