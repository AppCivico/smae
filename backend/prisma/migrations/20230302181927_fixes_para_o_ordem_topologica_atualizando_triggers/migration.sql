/*
  Warnings:

  - The `ordem_topologica_inicio_planejado` column on the `tarefa` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ordem_topologica_termino_planejado` column on the `tarefa` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tarefa" DROP COLUMN "ordem_topologica_inicio_planejado",
ADD COLUMN     "ordem_topologica_inicio_planejado" INTEGER[],
DROP COLUMN "ordem_topologica_termino_planejado",
ADD COLUMN     "ordem_topologica_termino_planejado" INTEGER[];



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

    r record;
BEGIN

    -- apenas em modificações no primeiro nivel, recalcular o projeto diretamente
    IF NEW.tarefa_pai_id IS NULL THEN
        PERFORM atualiza_calendario_projeto(NEW.projeto_id);
    END IF;

    -- se tem dependentes, agora depois de atualizado o valor, precisa propagar essa informação para as tarefas
    -- dependentes

    FOR r IN
        select
            td.tarefa_id,
            inicio_planejado,
            termino_planejado,
            duracao_planejado
        from (
            select tarefa_id
            from tarefa_dependente
            where dependencia_tarefa_id = NEW.id
            and tipo in ('termina_pro_inicio', 'inicia_pro_inicio')
        ) td join tarefa t on td.tarefa_id = t.id
        --order by t.ordem_topologica_inicio_planejado desc -- comentando por enquanto, mas nessa array vai ter a lista
        -- de cada task pra ser visitada
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

        RAISE NOTICE '->> calcula_dependencias_tarefas %', v_tmp::text || ' ' || ROW_TO_JSON(r)::text;

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

        RAISE NOTICE '->> infere_data_inicio_ou_termino %', v_tmp::text;

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

    FOR r IN
        select
            td.tarefa_id,
            inicio_planejado,
            termino_planejado,
            duracao_planejado
        from (
            select tarefa_id
            from tarefa_dependente
            where dependencia_tarefa_id = NEW.id
            and tipo not in ('termina_pro_inicio', 'inicia_pro_inicio')
        ) td join tarefa t on td.tarefa_id = t.id
        --order by t.ordem_topologica_termino_planejado desc
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

        RAISE NOTICE '->> calcula_dependencias_tarefas %', v_tmp::text || ' ' || ROW_TO_JSON(r)::text;

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

        RAISE NOTICE '->> infere_data_inicio_ou_termino %', v_tmp::text;

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
            (percentual_concluido IS DISTINCT FROM v_percentual_concluido)
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
            (percentual_concluido IS DISTINCT FROM v_percentual_concluido)
        );

    END IF;

    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;

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


