DROP PROCEDURE create_workflow_cronograma;
CREATE OR REPLACE PROCEDURE create_workflow_cronograma (_transferencia_id INTEGER, _workflow_id INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    _tarefa_cronograma_id INT;
BEGIN
    INSERT INTO tarefa_cronograma (transferencia_id) VALUES (_transferencia_id) RETURNING id INTO _tarefa_cronograma_id;

    UPDATE transferencia SET nivel_maximo_tarefa = 3 WHERE id = _transferencia_id;

    WITH row_distribuicao_recurso AS (
        SELECT
            orgao_gestor_id
        FROM distribuicao_recurso
        WHERE
            removido_em IS NULL AND
            transferencia_id = _transferencia_id
        ORDER BY criado_em ASC
        LIMIT 1
    ), etapas AS (
        SELECT
            fluxo.id,
            e1.etapa_fluxo AS etapa_de,
            e1.id AS etapa_de_id,
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
            f.id as fase_id,
            e.etapa_de AS tarefa_pai,
            fluxo_fase.responsabilidade,
            fluxo_fase.ordem,
            fluxo_fase.marco,
            fluxo_fase.duracao,
            ta.id AS transferencia_andamento_id,
            ta.data_inicio
        FROM fluxo_fase
        JOIN etapas e ON fluxo_fase.fluxo_id = e.id
        JOIN workflow_fase f ON fluxo_fase.fase_id = f.id
        JOIN transferencia_andamento ta ON ta.workflow_fase_id = f.id
            AND ta.transferencia_id = _transferencia_id AND ta.workflow_etapa_id = e.etapa_de_id
        WHERE fluxo_fase.removido_em IS NULL
        ORDER BY e.id ASC, ordem ASC
    ), tarefas_fases AS (
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, numero, nivel, tarefa_pai_id, inicio_real, transferencia_fase_id, orgao_id)
        SELECT
            _tarefa_cronograma_id,
            fases.fase, fases.fase, '',
            fases.ordem,
            2,
            te.id,
            fases.data_inicio,
            fases.transferencia_andamento_id,
            CASE
                WHEN fases.responsabilidade::varchar = 'Propria'
                THEN ( SELECT id FROM orgao WHERE sigla = 'SERI' )
                ELSE ( SELECT orgao_gestor_id FROM row_distribuicao_recurso )
            END
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
            fluxo_tarefa.duracao,
            taf.id AS transferencia_tarefa_id
        FROM fluxo_tarefa
        JOIN fases f ON fluxo_tarefa.fluxo_fase_id = f.id
        JOIN workflow_tarefa t ON fluxo_tarefa.workflow_tarefa_id = t.id
        JOIN transferencia_andamento_tarefa taf ON taf.workflow_tarefa_fluxo_id = t.id AND taf.removido_em IS NULL
        JOIN transferencia_andamento ta ON ta.id = taf.transferencia_andamento_id
            AND ta.transferencia_id = _transferencia_id AND ta.workflow_fase_id = f.fase_id
        WHERE fluxo_tarefa.removido_em IS NULL 
        ORDER BY f.id ASC, fluxo_tarefa.ordem ASC
    ), tarefas_tarefa AS (
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, numero, nivel, tarefa_pai_id, transferencia_tarefa_id, orgao_id)
        SELECT
            _tarefa_cronograma_id,
            tarefas.tarefa_fluxo, tarefas.tarefa_fluxo, '',
            tarefas.ordem,
            3,
            tf.id,
            tarefas.transferencia_tarefa_id,
            CASE
                WHEN tarefas.responsabilidade::varchar = 'Propria'
                THEN ( SELECT id FROM orgao WHERE sigla = 'SERI' )
                ELSE ( SELECT orgao_gestor_id FROM row_distribuicao_recurso )
            END
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
