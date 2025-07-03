DROP PROCEDURE if exists create_workflow_cronograma;
CREATE OR REPLACE PROCEDURE create_workflow_cronograma (_transferencia_id INTEGER, _workflow_id INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    _tarefa_cronograma_id INT;
    _orgao_seri_id INT;
    _numero_base INT;
BEGIN
    SELECT id FROM orgao WHERE sigla = 'SERI' INTO _orgao_seri_id;

    -- Verificando se já existe row de tarefa_cronogrma, caso exista, ela é utilizada.
    -- Caso não exista, é criado.
    SELECT id INTO _tarefa_cronograma_id FROM tarefa_cronograma WHERE transferencia_id = _transferencia_id AND removido_em IS NULL;
    IF _tarefa_cronograma_id IS NULL THEN
        INSERT INTO tarefa_cronograma (transferencia_id, criado_em) VALUES (_transferencia_id, now()) RETURNING id INTO _tarefa_cronograma_id;
    END IF;

    -- Verificando se já existem tarefas, caso existam, é necessário manter o nível e o número e o cronograma do workflow, será appendado.
    SELECT COALESCE(MAX(numero), 0) INTO _numero_base FROM tarefa WHERE tarefa_cronograma_id = _tarefa_cronograma_id;

    UPDATE transferencia SET nivel_maximo_tarefa = 3 WHERE id = _transferencia_id;

    WITH etapas AS (
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
        RETURNING id, tarefa
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
            CASE
                WHEN te.id = (SELECT min(id) FROM tarefas_etapas) THEN current_date
                ELSE NULL
            END,
            CASE
                WHEN te.id = (SELECT min(id) FROM tarefas_etapas) THEN current_date
                ELSE NULL
            END
        FROM tarefas_etapas te
        RETURNING id, tarefa_pai_id, numero
    ), fases AS (
        SELECT
            fluxo_fase.id as fluxo_fase_id,
            f.fase,
            f.id as fase_id,
            e.etapa_de AS tarefa_pai,
            fluxo_fase.responsabilidade,
            fluxo_fase.ordem,
            fluxo_fase.marco,
            fluxo_fase.duracao,
            ta.id AS transferencia_andamento_id,
            ta.data_inicio,
            e.etapa_de_id,
            fluxo_fase.fluxo_id
        FROM fluxo_fase
        JOIN etapas e ON fluxo_fase.fluxo_id = e.id
        JOIN workflow_fase f ON fluxo_fase.fase_id = f.id
        JOIN transferencia_andamento ta ON ta.workflow_fase_id = f.id
            AND ta.transferencia_id = _transferencia_id AND ta.workflow_etapa_id = e.etapa_de_id
            AND ta.removido_em IS NULL
        WHERE fluxo_fase.removido_em IS NULL
        ORDER BY e.id ASC, ordem ASC
    ), tarefas_fases AS (
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, numero, nivel, tarefa_pai_id, inicio_real, transferencia_fase_id, eh_marco, duracao_planejado, orgao_id, inicio_planejado)
        SELECT
            _tarefa_cronograma_id,
            fases.fase, fases.fase, '',
            fases.ordem + 1,
            2,
            te.id,
            fases.data_inicio,
            fases.transferencia_andamento_id,
            fases.marco,
            fases.duracao,
            CASE
                WHEN fases.responsabilidade::varchar = 'Propria'
                THEN _orgao_seri_id
                ELSE NULL
            END,
            CASE
                WHEN fases.data_inicio IS NOT NULL THEN fases.data_inicio
                ELSE NULL
            END
        FROM fases
        JOIN tarefas_etapas te ON te.tarefa = fases.tarefa_pai
        RETURNING *
    ), tarefas AS (
        SELECT
            t.tarefa_fluxo,
            f.fase AS tarefa_pai,
            fluxo_tarefa.responsabilidade,
            fluxo_tarefa.ordem,
            fluxo_tarefa.marco,
            fluxo_tarefa.duracao,
            taf.id AS transferencia_tarefa_id,
            f.fluxo_fase_id,
            f.fluxo_id,
            f.etapa_de_id
        FROM fluxo_tarefa
        JOIN fases f ON fluxo_tarefa.fluxo_fase_id = f.fluxo_fase_id
        JOIN workflow_tarefa t ON fluxo_tarefa.workflow_tarefa_id = t.id
        JOIN transferencia_andamento_tarefa taf ON taf.workflow_tarefa_fluxo_id = t.id AND taf.removido_em IS NULL
        JOIN transferencia_andamento ta ON ta.id = taf.transferencia_andamento_id
            AND ta.transferencia_id = _transferencia_id AND ta.workflow_fase_id = f.fase_id
            AND ta.removido_em IS NULL
        WHERE fluxo_tarefa.removido_em IS NULL
        ORDER BY f.fluxo_fase_id ASC, fluxo_tarefa.ordem ASC
    )
        INSERT INTO tarefa (tarefa_cronograma_id, tarefa, descricao, recursos, numero, nivel, tarefa_pai_id, transferencia_tarefa_id, eh_marco, duracao_planejado, orgao_id)
        SELECT
            _tarefa_cronograma_id,
            CASE WHEN tarefas.responsabilidade::varchar = 'Propria' THEN tarefas.tarefa_fluxo || '- SERI' ELSE 'Acompanhamento da tarefa: ' || tarefas.tarefa_fluxo END,
            CASE WHEN tarefas.responsabilidade::varchar = 'Propria' THEN tarefas.tarefa_fluxo || '- SERI' ELSE 'Acompanhamento da tarefa: ' || tarefas.tarefa_fluxo END,
            '',
            tarefas.ordem,
            3,
            tf.id,
            tarefas.transferencia_tarefa_id,
            tarefas.marco,
            tarefas.duracao,
            _orgao_seri_id
        FROM tarefas
        JOIN tarefas_fases tf ON tf.tarefa = tarefas.tarefa_pai
        JOIN transferencia_andamento taf ON taf.id = tf.transferencia_fase_id
        JOIN fluxo f ON f.id = tarefas.fluxo_id AND taf.workflow_etapa_id = f.fluxo_etapa_de_id;

    -- Dependências de nível de fase (CORRIGIDO E FILTRADO POR RESPONSABILIDADE)
    WITH dependencias_nivel_2 AS (
        SELECT
            t1.id as tarefa_id,
            CASE
                WHEN t2.id IS NOT NULL THEN t2.id -- Depende da tarefa anterior no mesmo grupo
                ELSE ( -- Se for a primeira tarefa do grupo, depende da última tarefa do grupo anterior
                    SELECT tx.id
                    FROM tarefa tx
                    JOIN tarefa tarefa_pai ON tarefa_pai.id = tx.tarefa_pai_id AND tarefa_pai.numero = ( SELECT numero FROM tarefa WHERE id = t1.tarefa_pai_id ) - 1
                    WHERE tx.tarefa_cronograma_id = _tarefa_cronograma_id
                        AND tx.nivel = t1.nivel
                    ORDER BY tx.numero DESC
                    LIMIT 1
                )
            END as dependencia_tarefa_id,
            CASE
                WHEN t1.numero = 1 THEN cast('inicia_pro_inicio' as "TarefaDependenteTipo")
                ELSE cast('termina_pro_inicio' as "TarefaDependenteTipo")
            END as tipo
        FROM tarefa t1
        -- AQUI ESTÁ A LÓGICA CORRETA PARA OBTER A RESPONSABILIDADE
        JOIN transferencia_andamento ta ON ta.id = t1.transferencia_fase_id
        JOIN fluxo_fase ff ON ff.fase_id = ta.workflow_fase_id AND ff.fluxo_id = (
             SELECT fluxo.id FROM fluxo WHERE fluxo.fluxo_etapa_de_id = ta.workflow_etapa_id and fluxo.workflow_id = _workflow_id AND fluxo.removido_em IS NULL limit 1
        )
        -- Fim da lógica
        LEFT JOIN tarefa t2 ON t2.nivel = t1.nivel AND t2.tarefa_pai_id = t1.tarefa_pai_id AND t2.numero = t1.numero - 1
        WHERE t1.tarefa_cronograma_id = _tarefa_cronograma_id
            AND t1.nivel = 2
            AND t1.transferencia_fase_id IS NOT NULL -- Garante que estamos lidando com uma tarefa que representa uma fase
            AND ff.responsabilidade = 'Propria' -- Filtra para criar dependências apenas para responsabilidade 'Propria'
            AND NOT EXISTS (SELECT 1 FROM tarefa WHERE tarefa_pai_id = t1.id)
    )
    INSERT INTO tarefa_dependente (tarefa_id, dependencia_tarefa_id, tipo, latencia)
    SELECT
        tarefa_id,
        dependencia_tarefa_id,
        tipo,
        0
    FROM dependencias_nivel_2
    WHERE dependencia_tarefa_id IS NOT NULL;

    -- Dependências de nível de tarefa
    WITH dependencias_nivel_3 AS (
         SELECT
            t1.id as tarefa_id,
            t2.id as dependencia_tarefa_id,
            cast('termina_pro_inicio' as "TarefaDependenteTipo") as tipo
        FROM tarefa t1
        JOIN tarefa t2 ON t2.nivel = t1.nivel AND t2.tarefa_pai_id = t1.tarefa_pai_id AND t2.numero = t1.numero - 1
        WHERE t1.tarefa_cronograma_id = _tarefa_cronograma_id AND t1.nivel = 3
    )
    INSERT INTO tarefa_dependente (tarefa_id, dependencia_tarefa_id, tipo, latencia)
    SELECT
        tarefa_id,
        dependencia_tarefa_id,
        tipo,
        0
    FROM dependencias_nivel_3
    WHERE dependencia_tarefa_id IS NOT NULL;


    -- Atualizando n_filhos_imediatos
    UPDATE tarefa t SET
        n_filhos_imediatos = (SELECT COUNT(1) FROM tarefa WHERE tarefa_pai_id = t.id)
    WHERE t.n_filhos_imediatos = 0 AND EXISTS (SELECT 1 FROM tarefa WHERE tarefa_pai_id = t.id) AND tarefa_cronograma_id = _tarefa_cronograma_id;

END;
$$;