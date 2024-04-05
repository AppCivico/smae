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

        -- Setando dados calculados como NULL
        UPDATE tarefa_cronograma SET
            previsao_inicio = NULL, previsao_termino = NULL,
            previsao_duracao = NULL, realizado_inicio = NULL,
            realizado_termino = NULL, realizado_duracao = NULL,
            realizado_custo = NULL, projecao_termino = NULL
        WHERE id = _tarefa_cronograma_id;

    END IF;

    -- Se o projeto destino da clonagem estiver na fase de “registro”. A clonagem é limitada às atividades de nivel 1.
    SELECT
        -- Operador na query de clone será "<=".
        CASE WHEN projeto.fase::TEXT = 'Registro' THEN 1
        ELSE portfolio.nivel_maximo_tarefa
        END
    FROM projeto
    JOIN portfolio ON projeto.portfolio_id = portfolio.id
    WHERE projeto.id = projeto_target_id
    INTO _nvl_tarefas;

    RETURN (_tarefa_cronograma_id, _nvl_tarefas);
COMMIT;
END;
$$ LANGUAGE plpgsql;
