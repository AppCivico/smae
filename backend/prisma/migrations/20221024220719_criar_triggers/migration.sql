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
        and e.etapa_pai_id is null -- apenas etapas (e nao fases e subfases)
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

        if (NEW.inicio_previsto IS NOT NULL) then
            UPDATE etapa e
            SET inicio_previsto = NEW.inicio_previsto
            WHERE e.id = NEW.etapa_pai_id
            AND (e.inicio_previsto IS NULL OR e.inicio_previsto > NEW.inicio_previsto); -- apenas se tiver maior
        END IF;

        IF  NEW.inicio_real IS NOT NULL THEN
            UPDATE etapa e
            SET inicio_real = NEW.inicio_real
            WHERE e.id = NEW.etapa_pai_id
            AND (e.inicio_real IS  NULL OR e.inicio_real > NEW.inicio_real) ;
        END IF;


        -- sempre recalcula o termino_previsto de acordo com a situacao atual
        SELECT (
             select max(termino_previsto) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id and removido_em is null
        ) into v_termino_previsto
        FROM etapa e
        WHERE e.id = NEW.etapa_pai_id
        AND (
            select count(1) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id
            AND ef.termino_previsto IS NULL  and removido_em is null
        ) = 0
        AND (e.termino_previsto IS NULL OR e.termino_previsto != (
             select max(termino_previsto) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id and removido_em is null
        ));


        -- sempre recalcula o termino_real de acordo com a situacao atual
        SELECT (
             select max(termino_real) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id  and removido_em is null
        ) into v_termino_real
        FROM etapa e
        WHERE e.id = NEW.etapa_pai_id
        AND (
            select count(1) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id
            AND ef.termino_real IS NULL  and removido_em is null
        ) = 0
        AND (termino_real is null or termino_real != (
             select max(termino_real) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id  and removido_em is null
        ));

        UPDATE etapa e
        SET termino_previsto = v_termino_previsto,
            termino_real = v_termino_real
        WHERE e.id = NEW.etapa_pai_id
        AND (
            (termino_previsto IS DISTINCT FROM v_termino_previsto) OR
            (termino_real IS DISTINCT FROM v_termino_real)
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
