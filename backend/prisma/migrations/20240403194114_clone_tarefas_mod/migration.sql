CREATE OR REPLACE FUNCTION setup_projeto_cronograma_clone (projeto_source_id INTEGER, projeto_target_id INTEGER)
RETURNS record AS $$
DECLARE
    _tarefa_cronograma_id INTEGER;
    _nvl_tarefas INTEGER;
BEGIN
    -- Criando/encontrando tarefa_cronograma
    IF NOT EXISTS (
        SELECT 1 FROM tarefa_cronograma WHERE projeto_id = projeto_target_id AND removido_em IS NULL
    )
    THEN
        INSERT INTO tarefa_cronograma (projeto_id) VALUES (projeto_target_id) RETURNING id INTO _tarefa_cronograma_id;
    ELSE
        SELECT id FROM tarefa_cronograma WHERE projeto_id = projeto_target_id AND removido_em IS NULL INTO _tarefa_cronograma_id;
        
        -- Caso o projeto "alvo" já tenha cronograma. Remover as tarefas existentes.
        UPDATE tarefa SET removido_em = NOW() WHERE tarefa_cronograma_id = _tarefa_cronograma_id AND removido_em IS NULL;
    END IF;

    -- Se o projeto destino da clonagem estiver na fase de “registro”. A clonagem é limitada às atividades de nivel 1.
    SELECT
        -- Operador na query de clone será "<=".
        CASE WHEN projeto.status::TEXT = 'Registro' THEN 1
        ELSE portfolio.nivel_maximo_tarefa
        END
    FROM projeto
    JOIN portfolio ON projeto.portfolio_id = portfolio.id
    WHERE projeto.id = projeto_target_id
    INTO _nvl_tarefas;

    RETURN (_tarefa_cronograma_id, _nvl_tarefas);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION setup_transferencia_cronograma_clone (transferencia_source_id INTEGER, transferencia_target_id INTEGER)
RETURNS record AS $$
DECLARE
    _tarefa_cronograma_id INTEGER;
    _nvl_tarefas INTEGER;
BEGIN
    -- Criando/encontrando tarefa_cronograma
    IF NOT EXISTS (
        SELECT 1 FROM tarefa_cronograma WHERE transferencia_id = transferencia_target_id AND removido_em IS NULL
    )
    THEN
        INSERT INTO tarefa_cronograma (transferencia_id) VALUES (transferencia_target_id) RETURNING id INTO _tarefa_cronograma_id;
    ELSE
        SELECT id FROM tarefa_cronograma WHERE transferencia_id = transferencia_target_id AND removido_em IS NULL INTO _tarefa_cronograma_id;
    END IF;

    SELECT nivel_maximo_tarefa FROM transferencia WHERE id = transferencia_source_id INTO _nvl_tarefas; 

    RETURN (_tarefa_cronograma_id, _nvl_tarefas);
END;
$$ LANGUAGE plpgsql;

drop procedure if exists clone_projeto_tarefas;
CREATE OR REPLACE PROCEDURE clone_tarefas (clone_de_projeto BOOLEAN, source_id INTEGER, target_id INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    _tarefa_cronograma_id INT;
    _nvl_tarefas INTEGER;
BEGIN
    CREATE TEMPORARY TABLE temp_source_tarefas ON COMMIT DROP AS TABLE tarefa WITH NO DATA ;
    CREATE TEMPORARY TABLE temp_new_tarefas ON COMMIT DROP AS TABLE tarefa WITH NO DATA;

    IF clone_de_projeto THEN
        SELECT * INTO _tarefa_cronograma_id, _nvl_tarefas FROM setup_projeto_cronograma_clone(source_id, target_id) AS (tarefa_cronograma_id INT, nvl_tarefas INT);
    ELSE
        SELECT * INTO _tarefa_cronograma_id, _nvl_tarefas FROM setup_transferencia_cronograma_clone(source_id, target_id) AS (tarefa_cronograma_id INT, nvl_tarefas INT);
    END IF;

    WITH source_tarefas AS (
        SELECT tarefa.* FROM tarefa
        JOIN tarefa_cronograma ON tarefa_cronograma.id = tarefa.tarefa_cronograma_id
        WHERE tarefa_cronograma.projeto_id = source_id AND
          tarefa_cronograma.removido_em IS NULL AND
          tarefa.removido_em IS NULL AND
          tarefa.nivel <= _nvl_tarefas -- Ler comentário na func "setup_projeto_cronograma_clone".
        ORDER BY nivel ASC
    )
    INSERT INTO temp_source_tarefas SELECT * FROM source_tarefas;

    WITH new_tarefas AS (
        INSERT INTO tarefa (
            tarefa_cronograma_id, tarefa_pai_id, tarefa, descricao, recursos, numero, nivel,
            n_dep_inicio_planejado, n_dep_termino_planejado, n_filhos_imediatos,
            eh_marco, duracao_planejado
        )
        SELECT
            _tarefa_cronograma_id AS tarefa_cronograma_id,

            t.tarefa_pai_id, t.tarefa, t.descricao, t.recursos, t.numero, t.nivel,
            t.n_dep_inicio_planejado, t.n_dep_termino_planejado, t.n_filhos_imediatos,
            t.eh_marco, t.duracao_planejado
        FROM temp_source_tarefas t
        RETURNING *
    )
    INSERT INTO temp_new_tarefas SELECT * FROM new_tarefas;

    WITH id_map AS (
        SELECT 
          st.id AS r_source_id,
          nt.id AS new_id
        FROM temp_source_tarefas st
        JOIN temp_new_tarefas nt ON st.tarefa = nt.tarefa AND st.numero = nt.numero AND st.nivel = nt.nivel
    ), dependencias AS (
        INSERT INTO tarefa_dependente (tarefa_id, dependencia_tarefa_id, tipo, latencia)
        SELECT
            (SELECT new_id FROM id_map WHERE r_source_id = d.tarefa_id) AS tarefa_id,
            (SELECT new_id FROM id_map WHERE r_source_id = d.dependencia_tarefa_id) AS dependencia_tarefa_id,
            d.tipo,
            d.latencia
        FROM id_map idm
        JOIN tarefa_dependente d ON d.tarefa_id = idm.r_source_id
    )
    UPDATE tarefa SET
        tarefa_pai_id = id_map.new_id 
    FROM id_map WHERE tarefa_pai_id = id_map.r_source_id AND tarefa_cronograma_id = _tarefa_cronograma_id;

EXCEPTION
  WHEN others THEN
    ROLLBACK;
    RAISE;
END;
$$;
