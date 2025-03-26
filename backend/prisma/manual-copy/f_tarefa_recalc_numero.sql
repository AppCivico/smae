CREATE OR REPLACE FUNCTION f_tarefa_recalc_numero(p_tarefa_cronograma_id INT)
RETURNS VARCHAR AS $$
BEGIN
    -- Use a CTE to calculate the correct 'numero' for ALL non-removed tasks
    -- within the specified cronograma, partitioned by parent and ordered by creation.
    WITH CorrectedNumeroCTE AS (
        SELECT
            id,
            numero, -- Keep the current numero to compare later
            -- Calculate the correct sequence number within each parent group
            ROW_NUMBER() OVER (PARTITION BY tarefa_pai_id ORDER BY criado_em ASC) as calculated_numero
        FROM tarefa
        WHERE tarefa_cronograma_id = p_tarefa_cronograma_id
          AND removido_em IS NULL -- Only consider active tasks
    )
    -- Update the 'tarefa' table
    UPDATE tarefa t
    SET numero = cte.calculated_numero -- Set the numero to the correctly calculated sequence
    FROM CorrectedNumeroCTE cte
    WHERE t.id = cte.id -- Join based on the task ID
      -- Crucially, only update rows where the calculated number is DIFFERENT
      -- from the existing number. This handles the "only update if needed" requirement.
      -- Using IS DISTINCT FROM handles NULLs correctly, though 'numero' likely isn't nullable here.
      AND t.numero IS DISTINCT FROM cte.calculated_numero;

    RETURN 'OK';
END;
$$ LANGUAGE plpgsql;
