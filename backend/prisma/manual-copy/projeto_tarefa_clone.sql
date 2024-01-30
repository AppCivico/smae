CREATE OR REPLACE FUNCTION clone_projeto_tarefas (projeto_source_id int, projeto_target_id int, orgao_target_id int)
RETURNS void AS $$
DECLARE
    row RECORD;
BEGIN
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_tarefas_ids (
    source_id INT,
    new_id INT
  );

  WITH source_tarefas AS (
    SELECT * FROM tarefa
    WHERE projeto_id = projeto_source_id AND removido_em IS NULL
    ORDER BY nivel ASC
  ), new_tarefas AS (
    INSERT INTO tarefa (
      projeto_id, orgao_id, tarefa_pai_id, tarefa, descricao, recursos,
      numero, nivel, inicio_planejado, termino_planejado, duracao_planejado,
      n_dep_inicio_planejado, n_dep_termino_planejado, inicio_real, termino_real,
      duracao_real, inicio_planejado_calculado, termino_planejado_calculado, duracao_planejado_calculado,
      projecao_inicio, projecao_termino, projecao_atraso, n_filhos_imediatos, custo_estimado,
      custo_real, eh_marco, percentual_concluido
    )
    SELECT
      projeto_target_id AS projeto_id,
      orgao_target_id AS orgao_id,

      t.tarefa_pai_id, t.tarefa, t.descricao, t.recursos, t.numero, t.nivel,
      t.inicio_planejado, t.termino_planejado, t.duracao_planejado, t.n_dep_inicio_planejado,
      t.n_dep_termino_planejado, t.inicio_real, t.termino_real, t.duracao_real,
      t.inicio_planejado_calculado, t.termino_planejado_calculado, t.duracao_planejado_calculado,
      t.projecao_inicio, t.projecao_termino, t.projecao_atraso, t.n_filhos_imediatos,
      t.custo_estimado, t.custo_real, t.eh_marco, t.percentual_concluido
    FROM source_tarefas t
    RETURNING id, tarefa, numero, nivel
  ), source_ids AS (
    SELECT 
      st.id AS source_id,
      nt.id AS new_id
    FROM source_tarefas st
    JOIN new_tarefas nt ON st.tarefa = nt.tarefa AND st.numero = nt.numero AND st.nivel = nt.nivel
  ),
  temp AS (
    INSERT INTO temp_tarefas_ids (source_id, new_id) SELECT * FROM source_ids RETURNING *
  )
  SELECT * INTO row FROM temp;
  UPDATE tarefa SET tarefa_pai_id = temp_tarefas_ids.new_id  FROM temp_tarefas_ids WHERE tarefa_pai_id = temp_tarefas_ids.source_id AND projeto_id = projeto_target_id;
  DELETE FROM temp_tarefas_ids;
END;
$$ LANGUAGE plpgsql;