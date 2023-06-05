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