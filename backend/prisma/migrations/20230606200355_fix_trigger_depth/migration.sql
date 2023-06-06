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

    SELECT count(1) INTO count_filhos
        FROM etapa WHERE etapa_pai_id = NEW.id AND removido_em IS NULL;

    IF count_filhos > 0 AND (
        OLD.inicio_previsto <> NEW.inicio_previsto OR
        OLD.inicio_real <> NEW.inicio_real OR
        OLD.termino_previsto <> NEW.termino_real OR
        OLD.termino_real <> NEW.termino_real)
    THEN
        SET session_replication_role = replica;
        UPDATE etapa e
        SET inicio_previsto = COALESCE(v_inicio_previsto, OLD.inicio_previsto),
            inicio_real = COALESCE(v_inicio_real, OLD.inicio_real),
            termino_previsto = COALESCE(v_termino_previsto, OLD.termino_previsto),
            termino_real = COALESCE(v_termino_real, OLD.termino_real)
        WHERE id = NEW.id;
        SET session_replication_role = DEFAULT;
    END IF;

    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;