-- CreateEnum
CREATE TYPE "ProjetoMotivoRelatorio" AS ENUM ('MudancaDeStatus', 'ProjetoEmAprovacao', 'ProjetoTerminou');

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "percentual_concluido" INTEGER,
ADD COLUMN     "tarefas_proximo_recalculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "projeto_acompanhamento" rename COLUMN "cronograma_paralizado" to "cronograma_paralisado";

-- AlterTable
ALTER TABLE "projeto_relatorio_fila" ADD COLUMN     "motivado_relatorio" "ProjetoMotivoRelatorio" NOT NULL DEFAULT 'MudancaDeStatus';


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
v_percentual_concluido int;

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
        percentual_concluido = v_percentual_concluido

    WHERE p.id = pProjetoId
    AND (
        (v_previsao_inicio is DISTINCT from previsao_inicio) OR
        (v_realizado_inicio is DISTINCT from realizado_inicio) OR
        (v_previsao_termino is DISTINCT from previsao_termino) OR
        (v_realizado_termino is DISTINCT from realizado_termino) OR
        (v_previsao_custo is DISTINCT from previsao_custo) OR
        (v_realizado_custo is DISTINCT from realizado_custo) OR
        (v_previsao_duracao is DISTINCT from previsao_duracao) OR
        (v_percentual_concluido is DISTINCT from percentual_concluido) OR
        (v_realizado_duracao is DISTINCT from realizado_duracao)
    );

    return '';
END
$$
LANGUAGE plpgsql;

select atualiza_calendario_projeto(id) from projeto;


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
        --order by t.ordem_topologica_inicio_planejado desc
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

    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;
