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
              AND ef2.termino_previsto IS NULL
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

CREATE TRIGGER trg_estapa_esticar_datas_do_pai AFTER INSERT ON etapa
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_estapa_esticar_datas_do_pai();

CREATE TRIGGER trg_estapa_esticar_datas_do_pai_update AFTER  UPDATE ON etapa
    FOR EACH ROW
    WHEN (
        (OLD.inicio_previsto IS DISTINCT FROM NEW.inicio_previsto)
        OR
        (OLD.termino_previsto IS DISTINCT FROM NEW.termino_previsto)
        OR
        (OLD.inicio_real IS DISTINCT FROM NEW.inicio_real)
        OR
        (OLD.termino_real IS DISTINCT FROM NEW.termino_real)
        OR
        (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    )
    EXECUTE FUNCTION f_trg_estapa_esticar_datas_do_pai();

CREATE OR REPLACE FUNCTION f_trg_crono_estapa_resync() RETURNS trigger AS $emp_stamp$
BEGIN
    PERFORM  atualiza_inicio_fim_cronograma(NEW.cronograma_id);
    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;

CREATE TRIGGER trg_estapa_esticar_datas_do_pai AFTER INSERT OR DELETE OR UPDATE ON cronograma_etapa
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_crono_estapa_resync();

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

CREATE TRIGGER trg_calculate_percentual_execucao
AFTER INSERT OR UPDATE ON etapa
FOR EACH ROW
EXECUTE FUNCTION calculate_percentual_execucao_trigger();

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

