CREATE OR REPLACE PROCEDURE create_workflow_cronograma (transferencia_id INTEGER, _workflow_id INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    _tarefa_cronograma_id INT;
BEGIN
    -- 
    INSERT INTO tarefa_cronograma (transferencia_id) VALUES (transferencia_id) RETURNING id INTO _tarefa_cronograma_id;

    -- Etapas são tarefas de nvl 1.
    WITH etapas AS (
        SELECT
            fluxo.id,
            e1.etapa_fluxo AS etapa_de,
            e2.etapa_fluxo AS etapa_para,
            row_number() OVER( ORDER BY fluxo.id ) AS numero
        FROM fluxo
        JOIN workflow_etapa e1 ON fluxo.fluxo_etapa_de_id = e1.id
        JOIN workflow_etapa e2 ON fluxo.fluxo_etapa_para_id = e2.id
        WHERE workflow_id = _workflow_id AND fluxo.removido_em IS NULL
    ), tarefas_etapas AS (
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, numero, nivel)
        SELECT
            _tarefa_cronograma_id,
            etapa_de, etapa_de, '',
            numero, 1
        FROM etapas
        RETURNING id, tarefa
    ), dependencias_etapas AS (
        INSERT INTO tarefa_dependente (tarefa_id, dependencia_tarefa_id, tipo, latencia)
        SELECT
            te.id,
            te2.id,
            'termina_pro_inicio',
            0
        FROM tarefas_etapas te
        JOIN etapas e ON te.tarefa = e.etapa_para
        JOIN tarefas_etapas te2 ON te2.tarefa = e.etapa_de
        RETURNING *
    ), fases AS (
        SELECT
            fluxo_fase.id,
            f.fase,
            e.etapa_de AS tarefa_pai,
            fluxo_fase.responsabilidade,
            fluxo_fase.ordem,
            fluxo_fase.marco,
            fluxo_fase.duracao
        FROM fluxo_fase
        JOIN etapas e ON fluxo_fase.fluxo_id = e.id
        JOIN workflow_fase f ON fluxo_fase.fase_id = f.id
        WHERE fluxo_fase.removido_em IS NULL
        ORDER BY e.id ASC, ordem ASC
    ), tarefas_fases AS (
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, numero, nivel, tarefa_pai_id)
        SELECT
            _tarefa_cronograma_id,
            fases.fase, fases.fase, '',
            fases.ordem,
            2,
            te.id
        FROM fases
        JOIN tarefas_etapas te ON te.tarefa = fases.tarefa_pai
        RETURNING *
    ), dependencias_fases AS (
        INSERT INTO tarefa_dependente (tarefa_id, dependencia_tarefa_id, tipo, latencia)
        SELECT
            tf.id,
            tf2.id,
            'termina_pro_inicio',
            0
        FROM tarefas_fases tf
        JOIN fases f ON tf.tarefa = f.fase
        JOIN tarefas_fases tf2 ON tf2.numero = tf.numero + 1 AND tf.tarefa_pai_id = tf2.tarefa_pai_id
        WHERE tf.numero > 1
        RETURNING *
    ), tarefas AS (
        SELECT
            t.tarefa_fluxo,
            f.fase AS tarefa_pai,
            fluxo_tarefa.responsabilidade,
            fluxo_tarefa.ordem,
            fluxo_tarefa.marco,
            fluxo_tarefa.duracao
        FROM fluxo_tarefa
        JOIN fases f ON fluxo_tarefa.fluxo_fase_id = f.id
        JOIN workflow_tarefa t ON fluxo_tarefa.workflow_tarefa_id = t.id
        WHERE fluxo_tarefa.removido_em IS NULL 
        ORDER BY f.id ASC, fluxo_tarefa.ordem ASC
    ), tarefas_tarefa AS (
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, numero, nivel, tarefa_pai_id)
        SELECT
            _tarefa_cronograma_id,
            tarefas.tarefa_fluxo, tarefas.tarefa_fluxo, '',
            tarefas.ordem,
            3,
            tf.id
        FROM tarefas
        JOIN tarefas_fases tf ON tf.tarefa = tarefas.tarefa_pai
        RETURNING *
    )
        INSERT INTO tarefa_dependente (tarefa_id, dependencia_tarefa_id, tipo, latencia)
        SELECT
            tt.id,
            tt2.id,
            'termina_pro_inicio',
            0
        FROM tarefas_tarefa tt
        JOIN tarefas t ON tt.tarefa = t.tarefa_fluxo
        JOIN tarefas_tarefa tt2 ON tt2.numero = tt.numero + 1 AND tt.tarefa_pai_id = tt2.tarefa_pai_id
        WHERE tt.numero > 1;

END;
$$;
