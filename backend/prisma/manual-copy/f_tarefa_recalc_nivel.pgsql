CREATE OR REPLACE FUNCTION f_tarefa_recalc_nivel(p_tarefa_cronograma_id INT)
RETURNS VARCHAR AS $$
BEGIN
    WITH RECURSIVE tarefa_tree AS (
        -- Todas as tarefas raiz (tarefa_pai_id IS NULL)
        SELECT id, 1 AS nivel
        FROM tarefa
        WHERE tarefa_cronograma_id = p_tarefa_cronograma_id
          AND tarefa_pai_id IS NULL
          AND removido_em IS NULL
        UNION ALL
        -- todas as tarefas filhas
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
      AND t.nivel != tt.nivel; -- só atualiza se o nível mudou

    RETURN 'OK';
END;
$$ LANGUAGE plpgsql;
