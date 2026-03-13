CREATE OR REPLACE FUNCTION f_tarefa_fix_numero_transferencia(p_transferencia_id INT) RETURNS VARCHAR AS $$
DECLARE _rows_updated INT := 0;
BEGIN
    WITH transferencia_cronogramas AS (
        SELECT tc.id AS cronograma_id,
            t_xfer.workflow_id
        FROM tarefa_cronograma tc
            JOIN transferencia t_xfer ON tc.transferencia_id = t_xfer.id
        WHERE tc.transferencia_id = p_transferencia_id
            AND tc.removido_em IS NULL
            AND t_xfer.workflow_id IS NOT NULL
    ),
    fix_nivel1 AS (
        SELECT DISTINCT ON (t.id) t.id AS tarefa_id,
            f.ordem AS numero_correto
        FROM tarefa t
            JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
            JOIN tarefa t_child ON t_child.tarefa_pai_id = t.id
            AND t_child.transferencia_fase_id IS NOT NULL
            AND t_child.removido_em IS NULL
            JOIN transferencia_andamento ta ON t_child.transferencia_fase_id = ta.id
            JOIN fluxo f ON f.fluxo_etapa_de_id = ta.workflow_etapa_id
            AND f.workflow_id = tc.workflow_id
            AND f.removido_em IS NULL
        WHERE t.nivel = 1
            AND t.removido_em IS NULL
    ),
    fix_nivel2_workflow AS (
        SELECT t.id AS tarefa_id,
            (ff.ordem + 1)::int AS numero_correto
        FROM tarefa t
            JOIN transferencia_andamento ta ON t.transferencia_fase_id = ta.id
            JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
            JOIN fluxo f ON f.workflow_id = tc.workflow_id
            AND f.fluxo_etapa_de_id = ta.workflow_etapa_id
            AND f.removido_em IS NULL
            JOIN fluxo_fase ff ON ff.fluxo_id = f.id
            AND ff.fase_id = ta.workflow_fase_id
            AND ff.removido_em IS NULL
        WHERE t.nivel = 2
            AND t.removido_em IS NULL
            AND t.transferencia_fase_id IS NOT NULL
    ),
    fix_nivel2_acomp AS (
        SELECT t.id AS tarefa_id,
            1 AS numero_correto
        FROM tarefa t
            JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
        WHERE t.nivel = 2
            AND t.removido_em IS NULL
            AND t.transferencia_fase_id IS NULL
            AND t.transferencia_tarefa_id IS NULL
            AND t.tarefa LIKE 'Acompanhamento da etapa %'
    ),
    max_workflow_numero AS (
        SELECT tarefa_pai_id,
            MAX(numero_correto) AS max_num
        FROM (
                SELECT t.tarefa_pai_id,
                    (ff.ordem + 1) AS numero_correto
                FROM tarefa t
                    JOIN transferencia_andamento ta ON t.transferencia_fase_id = ta.id
                    JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
                    JOIN fluxo f ON f.workflow_id = tc.workflow_id
                    AND f.fluxo_etapa_de_id = ta.workflow_etapa_id
                    AND f.removido_em IS NULL
                    JOIN fluxo_fase ff ON ff.fluxo_id = f.id
                    AND ff.fase_id = ta.workflow_fase_id
                    AND ff.removido_em IS NULL
                WHERE t.nivel = 2
                    AND t.removido_em IS NULL
            ) sub
        GROUP BY tarefa_pai_id
    ),
    fix_nivel2_custom_last AS (
        SELECT t.id AS tarefa_id,
            (
                COALESCE(mwn.max_num, 0) + ROW_NUMBER() OVER (
                    PARTITION BY t.tarefa_pai_id
                    ORDER BY t.id
                )
            )::int AS numero_correto
        FROM tarefa t
            JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
            LEFT JOIN max_workflow_numero mwn ON mwn.tarefa_pai_id = t.tarefa_pai_id
        WHERE t.nivel = 2
            AND t.removido_em IS NULL
            AND t.transferencia_fase_id IS NULL
            AND t.transferencia_tarefa_id IS NULL
            AND t.tarefa NOT LIKE 'Acompanhamento da etapa %'
    ),
    all_fixes AS (
        SELECT *
        FROM fix_nivel1
        UNION ALL
        SELECT *
        FROM fix_nivel2_workflow
        UNION ALL
        SELECT *
        FROM fix_nivel2_acomp
        UNION ALL
        SELECT *
        FROM fix_nivel2_custom_last
    )
    UPDATE tarefa t
    SET numero = af.numero_correto
    FROM all_fixes af
    WHERE t.id = af.tarefa_id
        AND t.numero IS DISTINCT FROM af.numero_correto;

    GET DIAGNOSTICS _rows_updated = ROW_COUNT;

    RETURN 'OK: ' || _rows_updated || ' rows updated';
END;
$$ LANGUAGE plpgsql;


/*

-- check do que ta pendente
WITH transferencia_cronogramas AS (
      SELECT tc.id AS cronograma_id, t_xfer.workflow_id, t_xfer.id AS transferencia_id, t_xfer.identificador
      FROM tarefa_cronograma tc
      JOIN transferencia t_xfer ON tc.transferencia_id = t_xfer.id
      WHERE tc.transferencia_id IS NOT NULL
        AND tc.removido_em IS NULL
        AND t_xfer.workflow_id IS NOT NULL
        AND t_xfer.removido_em IS NULL
  ),

  fix_nivel1 AS (
      SELECT DISTINCT ON (t.id)
          t.id AS tarefa_id,
          t.numero AS numero_atual,
          f.ordem AS numero_correto,
          1 AS nivel,
          tc.transferencia_id,
          tc.identificador
      FROM tarefa t
      JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
      JOIN tarefa t_child ON t_child.tarefa_pai_id = t.id
          AND t_child.transferencia_fase_id IS NOT NULL
          AND t_child.removido_em IS NULL
      JOIN transferencia_andamento ta ON t_child.transferencia_fase_id = ta.id
      JOIN fluxo f ON f.fluxo_etapa_de_id = ta.workflow_etapa_id
          AND f.workflow_id = tc.workflow_id
          AND f.removido_em IS NULL
      WHERE t.nivel = 1 AND t.removido_em IS NULL
  ),

  fix_nivel2_workflow AS (
      SELECT
          t.id AS tarefa_id,
          t.numero AS numero_atual,
          (ff.ordem + 1)::int AS numero_correto,
          2 AS nivel,
          tc.transferencia_id,
          tc.identificador
      FROM tarefa t
      JOIN transferencia_andamento ta ON t.transferencia_fase_id = ta.id
      JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
      JOIN fluxo f ON f.workflow_id = tc.workflow_id
          AND f.fluxo_etapa_de_id = ta.workflow_etapa_id
          AND f.removido_em IS NULL
      JOIN fluxo_fase ff ON ff.fluxo_id = f.id
          AND ff.fase_id = ta.workflow_fase_id
          AND ff.removido_em IS NULL
      WHERE t.nivel = 2 AND t.removido_em IS NULL
        AND t.transferencia_fase_id IS NOT NULL
  ),

  fix_nivel2_acomp AS (
      SELECT
          t.id AS tarefa_id,
          t.numero AS numero_atual,
          1 AS numero_correto,
          2 AS nivel,
          tc.transferencia_id,
          tc.identificador
      FROM tarefa t
      JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
      WHERE t.nivel = 2
        AND t.removido_em IS NULL
        AND t.transferencia_fase_id IS NULL
        AND t.transferencia_tarefa_id IS NULL
        AND t.tarefa LIKE 'Acompanhamento da etapa %'
  ),

  max_workflow_numero AS (
      SELECT tarefa_pai_id, MAX(numero_correto) AS max_num
      FROM (
          SELECT t.tarefa_pai_id, (ff.ordem + 1) AS numero_correto
          FROM tarefa t
          JOIN transferencia_andamento ta ON t.transferencia_fase_id = ta.id
          JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
          JOIN fluxo f ON f.workflow_id = tc.workflow_id
              AND f.fluxo_etapa_de_id = ta.workflow_etapa_id
              AND f.removido_em IS NULL
          JOIN fluxo_fase ff ON ff.fluxo_id = f.id
              AND ff.fase_id = ta.workflow_fase_id
              AND ff.removido_em IS NULL
          WHERE t.nivel = 2 AND t.removido_em IS NULL
      ) sub
      GROUP BY tarefa_pai_id
  ),

  fix_nivel2_custom_last AS (
      SELECT
          t.id AS tarefa_id,
          t.numero AS numero_atual,
          (COALESCE(mwn.max_num, 0)
              + ROW_NUMBER() OVER (PARTITION BY t.tarefa_pai_id ORDER BY t.id))::int
          AS numero_correto,
          2 AS nivel,
          tc.transferencia_id,
          tc.identificador
      FROM tarefa t
      JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
      LEFT JOIN max_workflow_numero mwn ON mwn.tarefa_pai_id = t.tarefa_pai_id
      WHERE t.nivel = 2
        AND t.removido_em IS NULL
        AND t.transferencia_fase_id IS NULL
        AND t.transferencia_tarefa_id IS NULL
        AND t.tarefa NOT LIKE 'Acompanhamento da etapa %'
  ),

  all_fixes AS (
      SELECT * FROM fix_nivel1
      UNION ALL SELECT * FROM fix_nivel2_workflow
      UNION ALL SELECT * FROM fix_nivel2_acomp
      UNION ALL SELECT * FROM fix_nivel2_custom_last
  ),

  -- Transferencias that have at least one CHANGE
  transfers_with_changes AS (
      SELECT DISTINCT transferencia_id
      FROM all_fixes
      WHERE numero_atual != numero_correto
  )

  SELECT
      af.transferencia_id,
      af.identificador,
      af.tarefa_id,
      t.tarefa,
      t.nivel,
      t.tarefa_pai_id,
      t.tarefa_cronograma_id,
      af.numero_atual,
      af.numero_correto,
      CASE WHEN af.numero_atual != af.numero_correto THEN 'CHANGE' ELSE 'ok' END AS status
  FROM all_fixes af
  JOIN tarefa t ON t.id = af.tarefa_id
  WHERE af.transferencia_id IN (SELECT transferencia_id FROM transfers_with_changes)
  ORDER BY af.transferencia_id, t.nivel, t.tarefa_pai_id NULLS FIRST, af.numero_correto;

-- FIX
  WITH transferencia_cronogramas AS (
      SELECT tc.id AS cronograma_id, t_xfer.workflow_id, t_xfer.id AS transferencia_id, t_xfer.identificador
      FROM tarefa_cronograma tc
      JOIN transferencia t_xfer ON tc.transferencia_id = t_xfer.id
      WHERE tc.transferencia_id IS NOT NULL
        AND tc.removido_em IS NULL
        AND t_xfer.workflow_id IS NOT NULL
        AND t_xfer.removido_em IS NULL
  ),

  fix_nivel1 AS (
      SELECT DISTINCT ON (t.id)
          t.id AS tarefa_id,
          t.numero AS numero_atual,
          f.ordem AS numero_correto,
          1 AS nivel,
          tc.transferencia_id,
          tc.identificador
      FROM tarefa t
      JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
      JOIN tarefa t_child ON t_child.tarefa_pai_id = t.id
          AND t_child.transferencia_fase_id IS NOT NULL
          AND t_child.removido_em IS NULL
      JOIN transferencia_andamento ta ON t_child.transferencia_fase_id = ta.id
      JOIN fluxo f ON f.fluxo_etapa_de_id = ta.workflow_etapa_id
          AND f.workflow_id = tc.workflow_id
          AND f.removido_em IS NULL
      WHERE t.nivel = 1 AND t.removido_em IS NULL
  ),

  fix_nivel2_workflow AS (
      SELECT
          t.id AS tarefa_id,
          t.numero AS numero_atual,
          (ff.ordem + 1)::int AS numero_correto,
          2 AS nivel,
          tc.transferencia_id,
          tc.identificador
      FROM tarefa t
      JOIN transferencia_andamento ta ON t.transferencia_fase_id = ta.id
      JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
      JOIN fluxo f ON f.workflow_id = tc.workflow_id
          AND f.fluxo_etapa_de_id = ta.workflow_etapa_id
          AND f.removido_em IS NULL
      JOIN fluxo_fase ff ON ff.fluxo_id = f.id
          AND ff.fase_id = ta.workflow_fase_id
          AND ff.removido_em IS NULL
      WHERE t.nivel = 2 AND t.removido_em IS NULL
        AND t.transferencia_fase_id IS NOT NULL
  ),

  fix_nivel2_acomp AS (
      SELECT
          t.id AS tarefa_id,
          t.numero AS numero_atual,
          1 AS numero_correto,
          2 AS nivel,
          tc.transferencia_id,
          tc.identificador
      FROM tarefa t
      JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
      WHERE t.nivel = 2
        AND t.removido_em IS NULL
        AND t.transferencia_fase_id IS NULL
        AND t.transferencia_tarefa_id IS NULL
        AND t.tarefa LIKE 'Acompanhamento da etapa %'
  ),

  max_workflow_numero AS (
      SELECT tarefa_pai_id, MAX(numero_correto) AS max_num
      FROM (
          SELECT t.tarefa_pai_id, (ff.ordem + 1) AS numero_correto
          FROM tarefa t
          JOIN transferencia_andamento ta ON t.transferencia_fase_id = ta.id
          JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
          JOIN fluxo f ON f.workflow_id = tc.workflow_id
              AND f.fluxo_etapa_de_id = ta.workflow_etapa_id
              AND f.removido_em IS NULL
          JOIN fluxo_fase ff ON ff.fluxo_id = f.id
              AND ff.fase_id = ta.workflow_fase_id
              AND ff.removido_em IS NULL
          WHERE t.nivel = 2 AND t.removido_em IS NULL
      ) sub
      GROUP BY tarefa_pai_id
  ),

  fix_nivel2_custom_last AS (
      SELECT
          t.id AS tarefa_id,
          t.numero AS numero_atual,
          (COALESCE(mwn.max_num, 0)
              + ROW_NUMBER() OVER (PARTITION BY t.tarefa_pai_id ORDER BY t.id))::int
          AS numero_correto,
          2 AS nivel,
          tc.transferencia_id,
          tc.identificador
      FROM tarefa t
      JOIN transferencia_cronogramas tc ON t.tarefa_cronograma_id = tc.cronograma_id
      LEFT JOIN max_workflow_numero mwn ON mwn.tarefa_pai_id = t.tarefa_pai_id
      WHERE t.nivel = 2
        AND t.removido_em IS NULL
        AND t.transferencia_fase_id IS NULL
        AND t.transferencia_tarefa_id IS NULL
        AND t.tarefa NOT LIKE 'Acompanhamento da etapa %'
  ),

  all_fixes AS (
      SELECT * FROM fix_nivel1
      UNION ALL SELECT * FROM fix_nivel2_workflow
      UNION ALL SELECT * FROM fix_nivel2_acomp
      UNION ALL SELECT * FROM fix_nivel2_custom_last
  ),

  transfers_with_changes AS (
      SELECT DISTINCT transferencia_id
      FROM all_fixes
      WHERE numero_atual != numero_correto
  )

  SELECT f_tarefa_fix_numero_transferencia(transferencia_id)
  FROM transfers_with_changes;



*/

