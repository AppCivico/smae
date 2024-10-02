CREATE OR REPLACE FUNCTION f_fix_tarefa_nivel(p_tarefa_cronograma_id INT)
RETURNS VOID AS $$
BEGIN
    WITH RECURSIVE tarefa_tree AS (
        -- Selecione todas as tarefas raiz (tarefa_pai_id IS NULL)
        SELECT id, 1 AS nivel
        FROM tarefa
        WHERE tarefa_cronograma_id = p_tarefa_cronograma_id
          AND tarefa_pai_id IS NULL
          AND removido_em IS NULL

        UNION ALL
        -- Selecione todas as tarefas filhas
        SELECT t.id, tt.nivel + 1
        FROM tarefa t
        JOIN tarefa_tree tt ON t.tarefa_pai_id = tt.id
        WHERE t.tarefa_cronograma_id = p_tarefa_cronograma_id
          AND t.removido_em IS NULL
    )
    UPDATE tarefa t
    SET nivel = tt.nivel
    FROM tarefa_tree tt
    WHERE t.id = tt.id
      AND t.tarefa_cronograma_id = p_tarefa_cronograma_id
      AND t.removido_em IS NULL
      AND t.nivel != tt.nivel;
END;
$$ LANGUAGE plpgsql;
