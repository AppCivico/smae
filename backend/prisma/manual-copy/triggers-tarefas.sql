-- drop trigger trg_pp_tarefa_esticar_datas_do_pai_update on tarefa;
CREATE TRIGGER trg_pp_tarefa_esticar_datas_do_pai_update AFTER UPDATE ON tarefa
    FOR EACH ROW
    WHEN (
        (OLD.inicio_planejado IS DISTINCT FROM NEW.inicio_planejado)
        OR
        (OLD.termino_planejado IS DISTINCT FROM NEW.termino_planejado)
        OR
        (OLD.duracao_planejado IS DISTINCT FROM NEW.duracao_planejado)
        OR
        (OLD.inicio_real IS DISTINCT FROM NEW.inicio_real)
        OR
        (OLD.termino_real IS DISTINCT FROM NEW.termino_real)
        OR
        (OLD.duracao_real IS DISTINCT FROM NEW.duracao_real)
        OR
        (OLD.tarefa_pai_id IS DISTINCT FROM NEW.tarefa_pai_id)
        OR
        (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
        OR
        (OLD.percentual_concluido IS DISTINCT FROM NEW.percentual_concluido)
        OR
        (OLD.custo_estimado IS DISTINCT FROM NEW.custo_estimado)
        OR
        (OLD.custo_real IS DISTINCT FROM NEW.custo_real)
    )
    EXECUTE FUNCTION f_trg_pp_tarefa_esticar_datas_do_pai();

CREATE TRIGGER trg_pp_tarefa_esticar_datas_do_pai_insert AFTER INSERT ON tarefa
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_pp_tarefa_esticar_datas_do_pai();


CREATE OR REPLACE FUNCTION f_trg_pp_tarefa_dependente_inc_counter() RETURNS trigger AS $emp_stamp$
BEGIN
    UPDATE tarefa t
    SET
        n_dep_inicio_planejado =  n_dep_inicio_planejado + case when new.tipo in ('termina_pro_inicio', 'inicia_pro_inicio') then 1 else 0 end,
        n_dep_termino_planejado = n_dep_termino_planejado + case when new.tipo in ('termina_pro_inicio', 'inicia_pro_inicio') then 0 else 1 end
    WHERE t.id = NEW.tarefa_id;

    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_trg_pp_tarefa_dependente_dec_counter() RETURNS trigger AS $emp_stamp$
BEGIN
    UPDATE tarefa t
    SET
        n_dep_inicio_planejado =  n_dep_inicio_planejado - case when OLD.tipo in ('termina_pro_inicio', 'inicia_pro_inicio') then 1 else 0 end,
        n_dep_termino_planejado = n_dep_termino_planejado - case when OLD.tipo in ('termina_pro_inicio', 'inicia_pro_inicio') then 0 else 1 end
    WHERE t.id = OLD.tarefa_id;

    RETURN null;
END;
$emp_stamp$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pp_tarefa_dependente_insert AFTER INSERT ON tarefa_dependente
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_pp_tarefa_dependente_inc_counter();

CREATE TRIGGER trg_pp_tarefa_dependente_delete AFTER DELETE ON tarefa_dependente
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_pp_tarefa_dependente_dec_counter();



--

-- tratar os casos de intervalos negativos
CREATE OR REPLACE FUNCTION calcula_dependencias_tarefas(config jsonb)
    RETURNS jsonb
    AS $$
DECLARE
    ret jsonb;
BEGIN

    with conf as (
        select
            ((x->>'latencia')::int::varchar || ' days')::interval as latencia,
            (x->>'tipo')::varchar as tipo,
            --coalesce(t.inicio_real, t.inicio_planejado) as inicio,
            --coalesce(t.termino_real, t.termino_planejado) as termino,
            t.inicio_planejado as inicio,
            t.termino_planejado as termino,
            t.id as dependencia_tarefa_id
        from jsonb_array_elements(config) x
        join tarefa t on t.id = (x->>'dependencia_tarefa_id')::int and t.removido_em is null
    ),
    compute as (
        select
        case
            when tipo = 'termina_pro_inicio' then termino + latencia
            when tipo = 'inicia_pro_inicio' then inicio + latencia
            when tipo = 'inicia_pro_termino' then inicio + latencia
            when tipo = 'termina_pro_termino' then termino + latencia
        end as date,
        tipo
        from conf
    ),
    cols as (
        select
            case when tipo in ('termina_pro_inicio', 'inicia_pro_inicio') then 'inicio_planejado' else 'termino_planejado' end as col,
            max(date) as date
        from compute
        group by 1
    ),
    proc as (
        select
            termino_planejado::date - inicio_planejado::date + 1 as duracao_planejado,
            inicio_planejado,
            termino_planejado
        from (
            select
                (select date from cols where col = 'inicio_planejado') as inicio_planejado,
                (select date from cols where col = 'termino_planejado') as termino_planejado
        ) subq
    )
    select
        jsonb_build_object(
            'duracao_planejado_calculado',
            (select count(1) from cols) = 2,
            'inicio_planejado_calculado',
            (select count(1) from cols where col = 'inicio_planejado') = 1,
            'termino_planejado_calculado',
            (select count(1) from cols where col = 'termino_planejado') = 1,

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

CREATE OR REPLACE FUNCTION atualiza_ano_orcamento_projeto(pProjetoId int)
    RETURNS varchar
    AS $$
DECLARE
    v_anos  int[];
BEGIN

    WITH _int AS (
        SELECT
            extract('year' FROM coalesce(tc.previsao_inicio, p.previsao_inicio)) AS ini,
            extract('year' FROM coalesce(tc.realizado_termino, tc.previsao_termino, tc.previsao_inicio, p.previsao_termino, p.previsao_inicio)) AS fim
        FROM
            projeto p
            left join tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
        WHERE
            p.id = pProjetoId
    ),
    _anos AS ( SELECT ano.ano FROM _int, generate_series(ini::int, fim::int, 1) ano ),
    _prev_custo AS (
        SELECT DISTINCT ano_referencia
        FROM meta_orcamento
        WHERE projeto_id = pProjetoId AND removido_em IS NULL
    ),
    _orc_plan AS (
        SELECT DISTINCT ano_referencia
        FROM orcamento_planejado
        WHERE projeto_id = pProjetoId AND removido_em IS NULL
    ),
    _orc_real AS (
        SELECT DISTINCT ano_referencia
        FROM orcamento_realizado
        WHERE projeto_id = pProjetoId AND removido_em IS NULL
    ),
    _range AS (
        SELECT ano
        FROM _anos
        UNION ALL
        SELECT ano_referencia
        FROM _orc_plan
        UNION ALL
        SELECT *
        FROM _prev_custo
        UNION ALL
        SELECT *
        FROM _orc_real
    )
    SELECT
        array_agg(DISTINCT ano ORDER BY ano) into v_anos
    FROM _range;

    UPDATE projeto
    SET ano_orcamento = v_anos
    WHERE id = pProjetoId
    AND ano_orcamento is DISTINCT from v_anos;

    return '';

END
$$
LANGUAGE plpgsql;



DROP FUNCTION atualiza_calendario_projeto(int);

CREATE OR REPLACE FUNCTION atualiza_calendario_tarefa_cronograma(pTarefaCronoId int)
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

v_projeto_id int;

BEGIN

    SELECT projeto_id into v_projeto_id
    from tarefa_cronograma
    where id = pTarefaCronoId;

    SELECT
        (
         select min(inicio_planejado)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.tarefa_cronograma_id = pTarefaCronoId and t.removido_em is null
         and inicio_planejado is not null
        ),
        (
         select min(inicio_real)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.tarefa_cronograma_id = pTarefaCronoId and t.removido_em is null
         and inicio_real is not null
        ),
        (
         select max(termino_planejado)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.tarefa_cronograma_id = pTarefaCronoId and t.removido_em is null
         and termino_planejado is not null
         and (
            select count(1) from tarefa t
            where t.tarefa_pai_id IS NULL and t.tarefa_cronograma_id = pTarefaCronoId and t.removido_em is null
            and termino_planejado is null
         ) = 0
        ),
        (
         select max(termino_real)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.tarefa_cronograma_id = pTarefaCronoId and t.removido_em is null
         and (
            select count(1) from tarefa t
            where t.tarefa_pai_id IS NULL and t.tarefa_cronograma_id = pTarefaCronoId and t.removido_em is null
            and termino_real is null
         ) = 0
        ),
        (
         select sum(custo_estimado)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.tarefa_cronograma_id = pTarefaCronoId and t.removido_em is null
         and custo_estimado is not null
        ),
        (
         select sum(custo_real)
         from tarefa t
         where t.tarefa_pai_id IS NULL and t.tarefa_cronograma_id = pTarefaCronoId and t.removido_em is null
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
        where t.tarefa_pai_id IS NULL and t.tarefa_cronograma_id = pTarefaCronoId and t.removido_em is null
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

    UPDATE tarefa_cronograma p
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

    WHERE p.id = pTarefaCronoId
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

    --rows_affected INTEGER;
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
            SELECT ARRAY(
                -- trata o caso quando o ID é zero, é a propria task
                SELECT CASE WHEN ot = 0 THEN d.tarefa_id ELSE ot END
                FROM unnest(x.ordem_topologica_inicio_planejado) WITH ORDINALITY AS a(ot, idx)
                ORDER BY a.idx DESC -- inverte a ordem
            ) AS ordem_topologica_inicio_planejado
            FROM tarefa_dependente d
            JOIN tarefa x on d.tarefa_id = x.id
            WHERE dependencia_tarefa_id = NEW.id
            AND tipo in ('termina_pro_inicio', 'inicia_pro_inicio')
        ) AS td
        JOIN LATERAL unnest(td.ordem_topologica_inicio_planejado) AS u(id) ON TRUE
        JOIN tarefa t ON t.id = u.id
    LOOP
        SELECT
            calcula_dependencias_tarefas(
                jsonb_agg(
                    jsonb_build_object('dependencia_tarefa_id', dependencia_tarefa_id, 'tipo', tipo, 'latencia', latencia)
                )
            ) AS result into v_tmp
        FROM tarefa_dependente td
        where tarefa_id = r.tarefa_id
        and tipo in ('termina_pro_inicio', 'inicia_pro_inicio');

--        RAISE NOTICE '%', current_setting('myvars.my_trigger_depth', true) || '| ->> calcula_dependencias_tarefas ' || v_tmp::text || ' ' || ROW_TO_JSON(r)::text;

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
                'termino_planejado_calculado', (v_tmp->>'termino_planejado')::date
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

    FOR r IN
        SELECT
            t.id as tarefa_id,
            t.inicio_planejado,
            t.termino_planejado,
            t.duracao_planejado
        FROM (
            SELECT ARRAY(
                -- trata o caso quando o ID é zero, é a propria task
                SELECT CASE WHEN ot = 0 THEN d.tarefa_id ELSE ot END
                FROM unnest(x.ordem_topologica_termino_planejado) WITH ORDINALITY AS a(ot, idx)
                ORDER BY a.idx DESC -- inverte a ordem
            ) AS ordem_topologica_termino_planejado
            FROM tarefa_dependente d
            JOIN tarefa x ON d.tarefa_id = x.id
            WHERE dependencia_tarefa_id = NEW.id
            AND tipo NOT IN ('termina_pro_inicio', 'inicia_pro_inicio')
        ) AS td
        -- JOIN laeral mantem a ordem
        JOIN LATERAL unnest(td.ordem_topologica_termino_planejado) AS u(id) ON TRUE
        JOIN tarefa t ON t.id = u.id
    LOOP
        SELECT
            calcula_dependencias_tarefas(
                jsonb_agg(
                    jsonb_build_object('dependencia_tarefa_id', dependencia_tarefa_id, 'tipo', tipo, 'latencia', latencia)
                )
            ) AS result into v_tmp
        FROM tarefa_dependente td
        where tarefa_id = r.tarefa_id
        and tipo not in ('termina_pro_inicio', 'inicia_pro_inicio');

        --RAISE NOTICE '->> calcula_dependencias_tarefas %', v_tmp::text || ' ' || ROW_TO_JSON(r)::text;

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
                'termino_planejado_calculado', (v_tmp->>'termino_planejado')::date
            )
        ) into v_tmp;

        --RAISE NOTICE '->> infere_data_inicio_ou_termino %', v_tmp::text;

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
    --EXECUTE 'SET myvars.my_trigger_depth = ' || (current_setting('myvars.my_trigger_depth')::int - 1);
--END $$;


    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;


/*
input:
    inicio_planejado_corrente: dto.inicio_planejado,
    termino_planejado_corrente: dto.termino_planejado,
    duracao_planejado_corrente: dto.duracao_planejado,

    inicio_planejado_calculado: dataDependencias.inicio_planejado,
    termino_planejado_calculado: dataDependencias.termino_planejado,
    duracao_planejado_calculado: dataDependencias.duracao_planejado,
output:
    inicio_planejado
    termino_planejado
    duracao_planejado

deve receber os dados existentes de tarefa, e retornar os novos dados, se existir alguma forma de fazer o complemento.

Se eu tenho numa tarefa X, uma duração 5, data de inicio = 1, e coloco uma dependencia no fim da tarefa Y

Nesse caso, que tem a data de duração preenchida, devo manter a duração da tarefa,
exceto caso a duração seja por motivo maiores (inicio e termino calculados pelo sistema),
então a data de termino é quem sofre a alteração, e não a duração

*/
CREATE OR REPLACE FUNCTION infere_data_inicio_ou_termino(config jsonb)
    RETURNS jsonb
    AS $$
DECLARE
    ret jsonb;
BEGIN

    with conf as (
        select
            ((x->>'duracao_planejado_corrente')::int::varchar || ' days')::interval as duracao_planejado_corrente,
            ((x->>'duracao_planejado_corrente')::int )  as duracao_planejado_corrente_dias,
            ((x->>'duracao_planejado_calculado')::int::varchar || ' days')::interval as duracao_planejado_calculado,
            (x->>'inicio_planejado_corrente')::date as inicio_planejado_corrente,
            (x->>'termino_planejado_corrente')::date as termino_planejado_corrente,
            (x->>'inicio_planejado_calculado')::date as inicio_planejado_calculado,
            (x->>'termino_planejado_calculado')::date as termino_planejado_calculado
        from jsonb_array_elements(('[' || config::text || ']')::jsonb) x
    ),
    compute0 as (
        select
            case
            -- se já tem valor calculado, ele sempre vence
            when inicio_planejado_calculado is not null then inicio_planejado_calculado
            -- se o campo tinha um valor, usa ele
            when inicio_planejado_corrente is not null then inicio_planejado_corrente else
                -- cenario onde é possível calcular a data de inicio pela duracao sugerida da tarefa
                -- usando a data de termino e a duração
                case when termino_planejado_calculado is not null and duracao_planejado_corrente is not null then
                    termino_planejado_calculado - duracao_planejado_corrente + '1 day'::interval -- adiciona um dia, pra se a task ter o valor de 1, ela deve começar e acabar no mesmo dia
                end
            end as inicio_planejado,
            duracao_planejado_corrente_dias,
            termino_planejado_calculado,
            inicio_planejado_calculado,
            termino_planejado_corrente,
            duracao_planejado_corrente

        from conf
    ),
    compute as (
            select inicio_planejado,

            case
            -- se tem começo e fim calculado, então retorna o termino calculado, passando na frente
            -- de qualquer valor que possa existir no corrente
            when termino_planejado_calculado is not null and inicio_planejado_calculado is not null then
                termino_planejado_calculado
                -- se tem inicio e duração, retorna sempre a soma do inicio + duração
            when inicio_planejado is not null and duracao_planejado_corrente is not null then
                inicio_planejado + duracao_planejado_corrente - '1 day'::interval
            when
                termino_planejado_corrente is not null
            then
                termino_planejado_corrente
            end as termino_planejado,
            duracao_planejado_corrente,
            duracao_planejado_corrente_dias

        from compute0
    ),
    proc as (
        select
            inicio_planejado,
            termino_planejado,

            -- se tem inicio/fim, calcula o real inicio/fim
            case when termino_planejado is not null and inicio_planejado is not null then
                termino_planejado::date - inicio_planejado::date + 1

            -- se não, usa o valor anterior do banco
            when duracao_planejado_corrente is not null then duracao_planejado_corrente_dias

            end as duracao_planejado
        from compute

    )
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
