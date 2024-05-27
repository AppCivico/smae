
CREATE OR REPLACE FUNCTION f_trg_pp_tarefa_esticar_datas_do_pai() RETURNS trigger AS $emp_stamp$
DECLARE
    v_inicio_planejado date;
    v_termino_planejado date;
    v_duracao_planejado INTEGER;
    v_inicio_real date;
    v_termino_real date;
    v_duracao_real INTEGER;
    v_count INTEGER;
    v_custo_estimado numeric;
    v_custo_real numeric;
    v_percentual_concluido numeric;

    v_tmp jsonb;

    v_tmp_inicio_calc boolean;
    v_tmp_termino_calc boolean;
    v_tmp_duracao_calc boolean;

--    rows_affected INTEGER;
    r record;
BEGIN

--DO $$
--BEGIN
--    IF current_setting('myvars.my_trigger_depth', true) IS NULL THEN
--        EXECUTE 'SET myvars.my_trigger_depth = 1';
--    ELSE
--        EXECUTE 'SET myvars.my_trigger_depth = ' || (current_setting('myvars.my_trigger_depth')::int + 1);
--    END IF;
--END $$;
    -- apenas em modificações no primeiro nivel, recalcular o projeto diretamente
    IF NEW.tarefa_pai_id IS NULL THEN
        PERFORM atualiza_calendario_tarefa_cronograma(NEW.tarefa_cronograma_id);
    END IF;

    -- se tem dependentes, agora depois de atualizado o valor, precisa propagar essa informação para as tarefas
    -- dependentes

--    RAISE NOTICE '%', current_setting('myvars.my_trigger_depth', true) || '| ->> indo atras das dependencias ordem_topologica_inicio_planejado para TAREFA ' || NEW.id::text;

    FOR r IN
        select
            t.id as tarefa_id,
            t.inicio_planejado,
            t.termino_planejado,
            t.duracao_planejado
        from (
            SELECT
                CASE WHEN x.ordem_topologica_inicio_planejado = ARRAY[]::int[]
                    THEN ARRAY[d.tarefa_id]
            ELSE
                ARRAY(
                    -- trata o caso quando o ID é zero, é a propria task
                    SELECT CASE WHEN ot = 0 THEN d.tarefa_id ELSE ot END
                    FROM unnest(x.ordem_topologica_inicio_planejado) WITH ORDINALITY AS a(ot, idx)
                    ORDER BY a.idx DESC -- inverte a ordem
                )
            END
                AS ordem_topologica_inicio_planejado
            FROM tarefa_dependente d
            JOIN tarefa x on d.tarefa_id = x.id
            WHERE dependencia_tarefa_id = NEW.id
            AND tipo in ('termina_pro_inicio', 'inicia_pro_inicio')
        ) AS td
        JOIN LATERAL unnest(td.ordem_topologica_inicio_planejado) AS u(id) ON u.id != NEW.id
        JOIN tarefa t ON t.id = u.id
    LOOP
        SELECT jsonb_agg(
                jsonb_build_object('dependencia_tarefa_id', dependencia_tarefa_id, 'tipo', tipo, 'latencia', latencia)
            ) into v_tmp
        FROM tarefa_dependente td
        where tarefa_id = r.tarefa_id;

        if (v_tmp is null) then
            RAISE NOTICE '%', current_setting('myvars.my_trigger_depth', true) || '| ->> calcula_dependencias_tarefas=NULL tarefa.dep=' || ROW_TO_JSON(r)::text;
            continue;
        end if;

        SELECT calcula_dependencias_tarefas(v_tmp) into v_tmp;

--        RAISE NOTICE '%', current_setting('myvars.my_trigger_depth', true) || '| ->> calcula_dependencias_tarefas=' || v_tmp::text || ' tarefa.dep=' || ROW_TO_JSON(r)::text;

        v_tmp_inicio_calc := (v_tmp->>'inicio_planejado_calculado')::boolean;
        v_tmp_termino_calc := (v_tmp->>'termino_planejado_calculado')::boolean;
        v_tmp_duracao_calc := (v_tmp->>'duracao_planejado_calculado')::boolean;

        select infere_data_inicio_ou_termino(
            jsonb_build_object(
                'duracao_planejado_corrente', case when v_tmp_duracao_calc then (v_tmp->>'v_tmp_duracao_calc')::int else r.duracao_planejado end,
                'duracao_planejado_calculado', (v_tmp->>'v_tmp_duracao_calc')::int,
                'inicio_planejado_corrente', case when v_tmp_inicio_calc then (v_tmp->>'inicio_planejado')::date else r.inicio_planejado end,
                'termino_planejado_corrente', case when v_tmp_termino_calc then (v_tmp->>'termino_planejado')::date else r.termino_planejado end,
                'inicio_planejado_calculado', (v_tmp->>'inicio_planejado')::date,
                'termino_planejado_calculado', (v_tmp->>'termino_planejado')::date,

                'inicio_planejado_calculado_flag', v_tmp_inicio_calc,
                'termino_planejado_calculado_flag', v_tmp_termino_calc
            )
        ) into v_tmp;

--        RAISE NOTICE '%', current_setting('myvars.my_trigger_depth', true) || '->> infere_data_inicio_ou_termino ' || v_tmp::text;

        update tarefa me
        set
            duracao_planejado = (v_tmp->>'duracao_planejado')::int,
            inicio_planejado = (v_tmp->>'inicio_planejado')::date,
            termino_planejado = (v_tmp->>'termino_planejado')::date,
            atualizado_em = now()
        where me.id = r.tarefa_id
        and (
            (duracao_planejado IS DISTINCT FROM (v_tmp->>'duracao_planejado')::int) OR
            (inicio_planejado IS DISTINCT FROM (v_tmp->>'inicio_planejado')::date) OR
            (termino_planejado IS DISTINCT FROM (v_tmp->>'termino_planejado')::date)
        );
--        GET DIAGNOSTICS rows_affected = ROW_COUNT;
--        RAISE NOTICE '%', current_setting('myvars.my_trigger_depth', true) || '->> Rows Affected: ' || rows_affected || ' on task ' || r.tarefa_id::text;

    END LOOP;

--    RAISE NOTICE '%', current_setting('myvars.my_trigger_depth', true) || '| ->> indo atras das dependencias ordem_topologica_termino_planejado para TAREFA ' || NEW.id::text;

    FOR r IN
        SELECT
            t.id as tarefa_id,
            t.inicio_planejado,
            t.termino_planejado,
            t.duracao_planejado
        FROM (
            SELECT
            CASE WHEN x.ordem_topologica_termino_planejado = ARRAY[]::int[]
                THEN ARRAY[d.tarefa_id]
            ELSE
                ARRAY(
                    -- trata o caso quando o ID é zero, é a propria task
                    SELECT CASE WHEN ot = 0 THEN d.tarefa_id ELSE ot END
                    FROM unnest(x.ordem_topologica_termino_planejado) WITH ORDINALITY AS a(ot, idx)
                    ORDER BY a.idx DESC -- inverte a ordem
                )
            END
                AS ordem_topologica_termino_planejado
            FROM tarefa_dependente d
            JOIN tarefa x ON d.tarefa_id = x.id
            WHERE dependencia_tarefa_id = NEW.id
            AND tipo NOT IN ('termina_pro_inicio', 'inicia_pro_inicio')
        ) AS td
        -- JOIN laeral mantem a ordem
        JOIN LATERAL unnest(td.ordem_topologica_termino_planejado) AS u(id) ON u.id != NEW.id
        JOIN tarefa t ON t.id = u.id
    LOOP
        SELECT jsonb_agg(
                jsonb_build_object('dependencia_tarefa_id', dependencia_tarefa_id, 'tipo', tipo, 'latencia', latencia)
            ) into v_tmp
        FROM tarefa_dependente td
        where tarefa_id = r.tarefa_id;

        if (v_tmp is null) then
            RAISE NOTICE '%', current_setting('myvars.my_trigger_depth', true) || '| ->> calcula_dependencias_tarefas=NULL tarefa.dep=' || ROW_TO_JSON(r)::text;
            continue;
        end if;

        SELECT calcula_dependencias_tarefas(v_tmp) into v_tmp;

--        RAISE NOTICE '->> calcula_dependencias_tarefas =%', v_tmp::text || ' tarefa.dep=' || ROW_TO_JSON(r)::text;

        v_tmp_inicio_calc := (v_tmp->>'inicio_planejado_calculado')::boolean;
        v_tmp_termino_calc := (v_tmp->>'termino_planejado_calculado')::boolean;
        v_tmp_duracao_calc := (v_tmp->>'duracao_planejado_calculado')::boolean;

        select infere_data_inicio_ou_termino(
            jsonb_build_object(
                'duracao_planejado_corrente', case when v_tmp_duracao_calc then (v_tmp->>'v_tmp_duracao_calc')::int else r.duracao_planejado end,
                'duracao_planejado_calculado', (v_tmp->>'v_tmp_duracao_calc')::int,
                'inicio_planejado_corrente', case when v_tmp_inicio_calc then (v_tmp->>'inicio_planejado')::date else r.inicio_planejado end,
                'termino_planejado_corrente', case when v_tmp_termino_calc then (v_tmp->>'termino_planejado')::date else r.termino_planejado end,
                'inicio_planejado_calculado', (v_tmp->>'inicio_planejado')::date,
                'termino_planejado_calculado', (v_tmp->>'termino_planejado')::date,

                'inicio_planejado_calculado_flag', v_tmp_inicio_calc,
                'termino_planejado_calculado_flag', v_tmp_termino_calc

            )
        ) into v_tmp;

--        RAISE NOTICE '->> infere_data_inicio_ou_termino %', v_tmp::text;

        update tarefa me
        set
            duracao_planejado = (v_tmp->>'duracao_planejado')::int,
            inicio_planejado = (v_tmp->>'inicio_planejado')::date,
            termino_planejado = (v_tmp->>'termino_planejado')::date,
            atualizado_em = now()
        where me.id = r.tarefa_id
        and (
            (duracao_planejado IS DISTINCT FROM (v_tmp->>'duracao_planejado')::int) OR
            (inicio_planejado IS DISTINCT FROM (v_tmp->>'inicio_planejado')::date) OR
            (termino_planejado IS DISTINCT FROM (v_tmp->>'termino_planejado')::date)
        );

    END LOOP;
    -- tarefa tem pai, entao vamos atualizar a mudança pra ele tbm

    IF OLD.tarefa_pai_id IS NOT NULL AND OLD.tarefa_pai_id IS DISTINCT FROM NEW.tarefa_pai_id THEN
        -- sempre recalcula cada campo pois pode ter tido uma remoção, e precisa propagar até mesmo o caso dos campos
        -- ganharem o valor de volta de null

        with subtarefas as (
            -- pega cada subtarefa
            select t.duracao_planejado, t.percentual_concluido
            from tarefa t
            where t.tarefa_pai_id = OLD.tarefa_pai_id
            and t.removido_em is null
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

        SELECT
            (
             select min(inicio_planejado)
             from tarefa t
             where t.tarefa_pai_id = OLD.tarefa_pai_id
             and t.removido_em is null
            ),
            (
             select min(inicio_real)
             from tarefa t
             where t.tarefa_pai_id = OLD.tarefa_pai_id
             and t.removido_em is null
            ),
            (
             select max(termino_planejado)
             from tarefa t
             where t.tarefa_pai_id = OLD.tarefa_pai_id
             and t.removido_em is null
             and (
                select count(1) from tarefa t
                where t.tarefa_pai_id = OLD.tarefa_pai_id
                and t.removido_em is null
                and termino_planejado is null
             ) = 0
            ),
            (
             select max(termino_real)
             from tarefa t
             where t.tarefa_pai_id = OLD.tarefa_pai_id
             and t.removido_em is null
             and (
                select count(1) from tarefa t
                where t.tarefa_pai_id = OLD.tarefa_pai_id
                and t.removido_em is null
                and termino_real is null
             ) = 0
            ),
            (
             select count(1)
             from tarefa t
             where t.tarefa_pai_id = OLD.tarefa_pai_id
             and t.removido_em is null
            ),
            (
             select sum(custo_estimado)
             from tarefa t
             where t.tarefa_pai_id = OLD.tarefa_pai_id
             and t.removido_em is null
             and custo_estimado is not null
            ),
            (
             select sum(custo_real)
             from tarefa t
             where t.tarefa_pai_id = OLD.tarefa_pai_id
             and t.removido_em is null
             and custo_real is not null
            )
            into
                v_inicio_planejado,
                v_inicio_real,
                v_termino_planejado,
                v_termino_real,
                v_count,
                v_custo_estimado,
                v_custo_real;

        v_duracao_planejado := v_termino_planejado - v_inicio_planejado + 1;
        v_duracao_real := v_termino_real - v_inicio_real + 1;

        UPDATE tarefa t
        SET
            inicio_planejado = v_inicio_planejado,
            inicio_real = v_inicio_real,
            termino_planejado = v_termino_planejado,
            termino_real = v_termino_real,
            n_filhos_imediatos = v_count,
            custo_estimado = v_custo_estimado,
            custo_real = v_custo_real,
            percentual_concluido = round(v_percentual_concluido * 100),
            duracao_planejado = v_duracao_planejado,
            duracao_real = v_duracao_real,
            atualizado_em = now()
        WHERE t.id = OLD.tarefa_pai_id
        AND (
            (inicio_planejado IS DISTINCT FROM v_inicio_planejado) OR
            (inicio_real IS DISTINCT FROM v_inicio_real) OR
            (termino_planejado IS DISTINCT FROM v_termino_planejado) OR
            (termino_real IS DISTINCT FROM v_termino_real) OR
            (n_filhos_imediatos IS DISTINCT FROM v_count) OR
            (custo_estimado IS DISTINCT FROM v_custo_estimado) OR
            (custo_real IS DISTINCT FROM v_custo_real) OR
            (duracao_real IS DISTINCT FROM v_duracao_real) OR
            (duracao_planejado IS DISTINCT FROM v_duracao_planejado) OR
            (percentual_concluido IS DISTINCT FROM round(v_percentual_concluido * 100))
        );
    END IF;

    IF NEW.tarefa_pai_id IS NOT NULL THEN
        -- sempre recalcula cada campo pois pode ter tido uma remoção, e precisa propagar até mesmo o caso dos campos
        -- ganharem o valor de volta de null

        with subtarefas as (
            -- pega cada subtarefa
            select t.duracao_planejado, t.percentual_concluido
            from tarefa t
            where t.tarefa_pai_id = NEW.tarefa_pai_id
            and t.removido_em is null
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

        SELECT
            (
             select min(inicio_planejado)
             from tarefa t
             where t.tarefa_pai_id = NEW.tarefa_pai_id
             and t.removido_em is null
            ),
            (
             select min(inicio_real)
             from tarefa t
             where t.tarefa_pai_id = NEW.tarefa_pai_id
             and t.removido_em is null
            ),
            (
             select max(termino_planejado)
             from tarefa t
             where t.tarefa_pai_id = NEW.tarefa_pai_id
             and t.removido_em is null
             and (
                select count(1) from tarefa t
                where t.tarefa_pai_id = NEW.tarefa_pai_id
                and t.removido_em is null
                and termino_planejado is null
             ) = 0
            ),
            (
             select max(termino_real)
             from tarefa t
             where t.tarefa_pai_id = NEW.tarefa_pai_id
             and t.removido_em is null
             and (
                select count(1) from tarefa t
                where t.tarefa_pai_id = NEW.tarefa_pai_id
                and t.removido_em is null
                and termino_real is null
             ) = 0
            ),
            (
             select count(1)
             from tarefa t
             where t.tarefa_pai_id = NEW.tarefa_pai_id
             and t.removido_em is null
            ),
            (
             select sum(custo_estimado)
             from tarefa t
             where t.tarefa_pai_id = NEW.tarefa_pai_id
             and t.removido_em is null
             and custo_estimado is not null
            ),
            (
             select sum(custo_real)
             from tarefa t
             where t.tarefa_pai_id = NEW.tarefa_pai_id
             and t.removido_em is null
             and custo_real is not null
            )
            into
                v_inicio_planejado,
                v_inicio_real,
                v_termino_planejado,
                v_termino_real,
                v_count,
                v_custo_estimado,
                v_custo_real;

        v_duracao_planejado := v_termino_planejado - v_inicio_planejado + 1;
        v_duracao_real := v_termino_real - v_inicio_real + 1;

        UPDATE tarefa t
        SET
            inicio_planejado = v_inicio_planejado,
            inicio_real = v_inicio_real,
            termino_planejado = v_termino_planejado,
            termino_real = v_termino_real,
            n_filhos_imediatos = v_count,
            custo_estimado = v_custo_estimado,
            custo_real = v_custo_real,
            percentual_concluido = round(v_percentual_concluido * 100.0),
            duracao_planejado = v_duracao_planejado,
            duracao_real = v_duracao_real,
            atualizado_em = now()
        WHERE t.id = NEW.tarefa_pai_id
        AND (
            (inicio_planejado IS DISTINCT FROM v_inicio_planejado) OR
            (inicio_real IS DISTINCT FROM v_inicio_real) OR
            (termino_planejado IS DISTINCT FROM v_termino_planejado) OR
            (termino_real IS DISTINCT FROM v_termino_real) OR
            (n_filhos_imediatos IS DISTINCT FROM v_count) OR
            (custo_estimado IS DISTINCT FROM v_custo_estimado) OR
            (custo_real IS DISTINCT FROM v_custo_real) OR
            (duracao_real IS DISTINCT FROM v_duracao_real) OR
            (duracao_planejado IS DISTINCT FROM v_duracao_planejado) OR
            (percentual_concluido IS DISTINCT FROM round(v_percentual_concluido * 100.0))
        );

    END IF;

--DO $$
--BEGIN
--    EXECUTE 'SET myvars.my_trigger_depth = ' || (current_setting('myvars.my_trigger_depth')::int - 1);
--END $$;


    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION infere_data_inicio_ou_termino(config jsonb)
    RETURNS jsonb
    AS $$
DECLARE
    ret jsonb;
BEGIN
--    raise notice 'infere_data_inicio_ou_termino args %', config;

    with conf as (
        select
            ((x->>'duracao_planejado_corrente')::int::varchar || ' days')::interval as duracao_planejado_corrente,
            ((x->>'duracao_planejado_corrente')::int) as duracao_planejado_corrente_dias,
            (x->>'inicio_planejado_corrente')::date as inicio_planejado_corrente,
            (x->>'termino_planejado_corrente')::date as termino_planejado_corrente,
            (x->>'inicio_planejado_calculado')::date as inicio_planejado_calculado,
            (x->>'termino_planejado_calculado')::date as termino_planejado_calculado,
            (x->>'inicio_planejado_calculado_flag')::boolean as inicio_planejado_calculado_flag,
            (x->>'termino_planejado_calculado_flag')::boolean as termino_planejado_calculado_flag
        from jsonb_array_elements(('[' || config::text || ']')::jsonb) x
    ),
    compute as (
        select
            -- calc do inicio:
            -- Se tanto o inicio quanto o termino forem calculados, vai por ele
            case when inicio_planejado_calculado_flag and termino_planejado_calculado_flag then
                inicio_planejado_calculado
            -- Se o termino for calculado, calcule o inicio com base na duração
            when termino_planejado_calculado_flag then
                termino_planejado_calculado - duracao_planejado_corrente + '1 day'::interval
            -- Caso contrário, use inicio existente ou calculado
            else
                coalesce(inicio_planejado_corrente, inicio_planejado_calculado)
            end as inicio_planejado,

            -- calc do termino:
            -- mesma logica de cima, só que retornando a coluna de termino
            case when inicio_planejado_calculado_flag and termino_planejado_calculado_flag then
                termino_planejado_calculado
            when inicio_planejado_calculado_flag then
                inicio_planejado_calculado + duracao_planejado_corrente - '1 day'::interval
            else
                coalesce(termino_planejado_corrente, termino_planejado_calculado)
            end as termino_planejado,

            duracao_planejado_corrente_dias,
            inicio_planejado_calculado_flag,
            termino_planejado_calculado_flag
        from conf
    ),
    proc as (
        select
            inicio_planejado,
            termino_planejado,
            -- Recalcular a duração se inicio e término forem calculados
            -- não precisa passar a flag pq seria true tbm
            case when inicio_planejado_calculado_flag and termino_planejado_calculado_flag then
                termino_planejado::date - inicio_planejado::date + 1
            -- Caso contrário, use a duração atual
            else duracao_planejado_corrente_dias
            end as duracao_planejado
        from compute
    )
    -- única parte que sobreviveu do código antigo, rs
    select
        jsonb_build_object(
            'duracao_planejado',
            duracao_planejado::int,
            'inicio_planejado',
            inicio_planejado::date,
            'termino_planejado',
            termino_planejado::date
        ) as res
        into ret
    from proc;

    return ret;
END
$$
LANGUAGE plpgsql;
