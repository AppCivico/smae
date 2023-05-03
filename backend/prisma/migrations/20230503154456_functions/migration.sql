CREATE OR REPLACE FUNCTION atualiza_calendario_projeto(pProjetoId int)
    RETURNS varchar
    AS $$
DECLARE

v_previsao_inicio  date;
v_realizado_inicio  date;
v_previsao_termino date;
v_realizado_termino date;
v_previsao_custo  numeric;
v_realizado_custo  numeric;
v_previsao_duracao int;
v_realizado_duracao int;
v_percentual_concluido numeric;

BEGIN

    SELECT
        (
         select min(inicio_planejado)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.projeto_id = pProjetoId and t.removido_em is null
         and inicio_planejado is not null
        ),
        (
         select min(inicio_real)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.projeto_id = pProjetoId and t.removido_em is null
         and inicio_real is not null
        ),
        (
         select max(termino_planejado)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.projeto_id = pProjetoId and t.removido_em is null
         and termino_planejado is not null
         and (
            select count(1) from tarefa t
            where t.tarefa_pai_id IS NULL and t.projeto_id = pProjetoId and t.removido_em is null
            and termino_planejado is null
         ) = 0
        ),
        (
         select max(termino_real)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.projeto_id = pProjetoId and t.removido_em is null
         and (
            select count(1) from tarefa t
            where t.tarefa_pai_id IS NULL and t.projeto_id = pProjetoId and t.removido_em is null
            and termino_real is null
         ) = 0
        ),
        (
         select sum(custo_estimado)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.projeto_id = pProjetoId and t.removido_em is null
         and custo_estimado is not null
        ),
        (
         select sum(custo_real)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.projeto_id = pProjetoId and t.removido_em is null
         and custo_real is not null
        )
        into
            v_previsao_inicio,
            v_realizado_inicio,
            v_previsao_termino,
            v_realizado_termino,
            v_previsao_custo,
            v_realizado_custo;

    v_previsao_duracao := case when v_previsao_inicio is not null and v_previsao_termino is not null
        then
            v_previsao_termino - v_previsao_inicio
        else
            null
        end;

    v_realizado_duracao := case when v_realizado_inicio is not null and v_realizado_termino is not null
        then
            v_realizado_termino - v_realizado_inicio
        else
            null
        end;

    with subtarefas as (
        -- pega cada tarefa (nivel 1)
        select t.duracao_planejado, t.percentual_concluido
        from tarefa t
        where t.tarefa_pai_id IS NULL and t.projeto_id = pProjetoId and t.removido_em is null
    ),
    t1 as (
        -- pega o total de horas planejadas, pode ser 0 se faltar preenchimento nos filhos, ou
        -- se tudo começar e acabar no mesmo dia
        select sum( t.duracao_planejado ) as total_duracao
        from subtarefas t
        where
            -- só calcular quando todos os filhos tiverem duracao
            (select count(1) from subtarefas st where st.duracao_planejado is null) = 0
    ),
    t2 as (
        -- divide cada subtarefa pelo total usando a conta que foi passada:
        -- (duracao prevista * nvl(percentual realizado, 0) / 100) / (soma das duracoes previstas)
        select (
            coalesce(t.duracao_planejado, 0)
                *
            coalesce(t.percentual_concluido, 0.0)
        )::numeric / 100.0 as prog_perc
        from subtarefas t
    )
    -- e entao aplica a soma
    select sum(prog_perc)::numeric / nullif((select total_duracao from t1), 0)::numeric into v_percentual_concluido
    from t2;

    UPDATE projeto p
    SET
        previsao_inicio = v_previsao_inicio,
        realizado_inicio = v_realizado_inicio,
        previsao_termino = v_previsao_termino,
        realizado_termino = v_realizado_termino,
        previsao_custo = v_previsao_custo,
        realizado_custo = v_realizado_custo,
        previsao_duracao = v_previsao_duracao,
        realizado_duracao = v_realizado_duracao,
        percentual_concluido = round(v_percentual_concluido * 100.0)

    WHERE p.id = pProjetoId
    AND (
        (v_previsao_inicio is DISTINCT from previsao_inicio) OR
        (v_realizado_inicio is DISTINCT from realizado_inicio) OR
        (v_previsao_termino is DISTINCT from previsao_termino) OR
        (v_realizado_termino is DISTINCT from realizado_termino) OR
        (v_previsao_custo is DISTINCT from previsao_custo) OR
        (v_realizado_custo is DISTINCT from realizado_custo) OR
        (v_previsao_duracao is DISTINCT from previsao_duracao) OR
        (round(v_percentual_concluido * 100.0) is DISTINCT from percentual_concluido) OR
        (v_realizado_duracao is DISTINCT from realizado_duracao)
    );

    return '';
END
$$
LANGUAGE plpgsql;
select atualiza_calendario_projeto(id) from projeto;
update projeto set tarefas_proximo_recalculo=now();

