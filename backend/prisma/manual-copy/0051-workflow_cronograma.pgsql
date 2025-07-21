DROP PROCEDURE IF EXISTS create_workflow_cronograma;
CREATE OR REPLACE PROCEDURE create_workflow_cronograma (_transferencia_id INTEGER, _workflow_id INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    _tarefa_cronograma_id INT;
    _orgao_seri_id INT;
    _numero_base INT;
BEGIN
    SELECT id FROM orgao WHERE sigla = 'SERI' INTO _orgao_seri_id;

    SELECT id INTO _tarefa_cronograma_id FROM tarefa_cronograma WHERE transferencia_id = _transferencia_id AND removido_em IS NULL;
    IF _tarefa_cronograma_id IS NULL THEN
        INSERT INTO tarefa_cronograma (transferencia_id, criado_em) VALUES (_transferencia_id, now()) RETURNING id INTO _tarefa_cronograma_id;
    END IF;

    SELECT COALESCE(MAX(numero), 0) INTO _numero_base FROM tarefa WHERE tarefa_cronograma_id = _tarefa_cronograma_id AND nivel = 1;

    UPDATE transferencia SET nivel_maximo_tarefa = 3 WHERE id = _transferencia_id;

    WITH etapas AS (
        SELECT
            fluxo.id,
            e1.etapa_fluxo AS etapa_de,
            e1.id AS etapa_de_id,
            -- THE FIX IS HERE: Order by the logical order from the workflow, not the table ID.
            row_number() OVER( ORDER BY fluxo.ordem ) AS numero
        FROM fluxo
        JOIN workflow_etapa e1 ON fluxo.fluxo_etapa_de_id = e1.id
        WHERE fluxo.workflow_id = _workflow_id AND fluxo.removido_em IS NULL
    ), tarefas_etapas AS (
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, numero, nivel, orgao_id, recursos)
        SELECT
            _tarefa_cronograma_id,
            etapa_de,
            etapa_de,
            _numero_base + numero,
            1,
            _orgao_seri_id,
            'SERI'
        FROM etapas
        RETURNING id, tarefa, numero
    ), tarefa_de_acompanhamento_etapa AS (
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, tarefa_pai_id, numero, nivel, orgao_id, inicio_real, inicio_planejado)
        SELECT
            _tarefa_cronograma_id,
            'Acompanhamento da etapa ' || te.tarefa,
            'Acompanhamento da etapa ' || te.tarefa,
            'SERI',
            te.id,
            1,
            2,
            _orgao_seri_id,
            CASE WHEN te.numero = (_numero_base + 1) THEN current_date ELSE NULL END,
            CASE WHEN te.numero = (_numero_base + 1) THEN current_date ELSE NULL END
        FROM tarefas_etapas te
        RETURNING id, tarefa_pai_id
    ), fases AS (
        SELECT
            fluxo_fase.id as fluxo_fase_id,
            f.fase,
            f.id as fase_id,
            te.id as tarefa_pai_id,
            fluxo_fase.responsabilidade,
            fluxo_fase.ordem,
            fluxo_fase.marco,
            fluxo_fase.duracao,
            ta.id AS transferencia_andamento_id
        FROM fluxo_fase
        JOIN etapas e ON fluxo_fase.fluxo_id = e.id
        JOIN tarefas_etapas te ON te.tarefa = e.etapa_de AND te.numero = (_numero_base + e.numero)
        JOIN workflow_fase f ON fluxo_fase.fase_id = f.id
        JOIN transferencia_andamento ta ON ta.workflow_fase_id = f.id
            AND ta.transferencia_id = _transferencia_id AND ta.workflow_etapa_id = e.etapa_de_id
            AND ta.removido_em IS NULL
        WHERE fluxo_fase.removido_em IS NULL
    ), tarefas_fases AS (
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, numero, nivel, tarefa_pai_id, transferencia_fase_id, eh_marco, duracao_planejado, orgao_id)
        SELECT
            _tarefa_cronograma_id,
            fases.fase, fases.fase, '',
            fases.ordem + 1,
            2,
            fases.tarefa_pai_id,
            fases.transferencia_andamento_id,
            fases.marco,
            fases.duracao,
            CASE WHEN fases.responsabilidade = 'Propria' THEN _orgao_seri_id ELSE NULL END
        FROM fases
        RETURNING *
    ), tarefas_subfases AS (
        SELECT
            wt.tarefa_fluxo,
            tf.id as tarefa_pai_id,
            ft.responsabilidade,
            ft.ordem,
            ft.marco,
            ft.duracao,
            tat.id AS transferencia_tarefa_id
        FROM fluxo_tarefa ft
        JOIN tarefas_fases tf ON ft.fluxo_fase_id = tf.transferencia_fase_id
        JOIN workflow_tarefa wt ON ft.workflow_tarefa_id = wt.id
        JOIN transferencia_andamento_tarefa tat ON tat.workflow_tarefa_fluxo_id = wt.id
        JOIN transferencia_andamento ta ON ta.id = tat.transferencia_andamento_id AND ta.id = tf.transferencia_fase_id
        WHERE ft.removido_em IS NULL AND ta.transferencia_id = _transferencia_id
    )
    INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, numero, nivel, tarefa_pai_id, transferencia_tarefa_id, eh_marco, duracao_planejado, orgao_id)
    SELECT
        _tarefa_cronograma_id,
        CASE WHEN tsf.responsabilidade = 'Propria' THEN tsf.tarefa_fluxo || ' - SERI' ELSE 'Acompanhamento da tarefa: ' || tsf.tarefa_fluxo END,
        CASE WHEN tsf.responsabilidade = 'Propria' THEN tsf.tarefa_fluxo || ' - SERI' ELSE 'Acompanhamento da tarefa: ' || tsf.tarefa_fluxo END,
        '',
        tsf.ordem,
        3,
        tsf.tarefa_pai_id,
        tsf.transferencia_tarefa_id,
        tsf.marco,
        tsf.duracao,
        _orgao_seri_id
    FROM tarefas_subfases tsf;

    -- Dependências para Nivel 2 (Fases)
   WITH dependencias_nivel_2 AS (
        SELECT
            t1.id as tarefa_id,
            COALESCE(
                t_sibling.id,
                t_cousin.id
            ) as dependencia_tarefa_id,
            CASE
                WHEN COALESCE(t_sibling.tarefa, t_cousin.tarefa) ILIKE 'Acompanhamento da etapa%'
                THEN cast('inicia_pro_inicio' as "TarefaDependenteTipo")
                ELSE cast('termina_pro_inicio' as "TarefaDependenteTipo")
            END as tipo
        FROM tarefa t1
        LEFT JOIN tarefa t_sibling ON t_sibling.tarefa_pai_id = t1.tarefa_pai_id AND t_sibling.numero = t1.numero - 1 AND t_sibling.tarefa_cronograma_id = _tarefa_cronograma_id
        LEFT JOIN tarefa t_parent_prev_sibling ON t_parent_prev_sibling.nivel = 1 AND t_parent_prev_sibling.numero = (SELECT numero FROM tarefa WHERE id = t1.tarefa_pai_id) - 1 AND t_parent_prev_sibling.tarefa_cronograma_id = _tarefa_cronograma_id
        LEFT JOIN tarefa t_cousin ON t_cousin.tarefa_pai_id = t_parent_prev_sibling.id AND t_cousin.numero = (SELECT MAX(numero) FROM tarefa WHERE tarefa_pai_id = t_parent_prev_sibling.id) AND t_cousin.tarefa_cronograma_id = _tarefa_cronograma_id
        WHERE t1.tarefa_cronograma_id = _tarefa_cronograma_id AND t1.nivel = 2
    )
    INSERT INTO tarefa_dependente (tarefa_id, dependencia_tarefa_id, tipo, latencia)
    SELECT tarefa_id, dependencia_tarefa_id, tipo, 0
    FROM dependencias_nivel_2
    WHERE dependencia_tarefa_id IS NOT NULL;


    -- Dependências para Nivel 3 (Sub-Fases/Tarefas)
    WITH dependencias_nivel_3 AS (
         SELECT
            t1.id as tarefa_id,
            t_sibling.id as dependencia_tarefa_id,
            cast('termina_pro_inicio' as "TarefaDependenteTipo") as tipo
        FROM tarefa t1
        JOIN tarefa t_sibling ON t_sibling.tarefa_pai_id = t1.tarefa_pai_id AND t_sibling.numero = t1.numero - 1 AND t_sibling.nivel = 3
        WHERE t1.tarefa_cronograma_id = _tarefa_cronograma_id AND t1.nivel = 3
    )
    INSERT INTO tarefa_dependente (tarefa_id, dependencia_tarefa_id, tipo, latencia)
    SELECT tarefa_id, dependencia_tarefa_id, tipo, 0
    FROM dependencias_nivel_3;


    -- Atualizando n_filhos_imediatos
    UPDATE tarefa t SET
        n_filhos_imediatos = (SELECT COUNT(1) FROM tarefa WHERE tarefa_pai_id = t.id)
    WHERE t.n_filhos_imediatos = 0 AND EXISTS (SELECT 1 FROM tarefa WHERE tarefa_pai_id = t.id) AND t.tarefa_cronograma_id = _tarefa_cronograma_id;

END;
$$;