
ALTER TABLE "tarefa" DROP CONSTRAINT "tarefa_projeto_id_fkey";

-- DropIndex
DROP INDEX "tarefa_projeto_id_removido_em_idx";


ALTER TABLE "tarefa" ADD COLUMN     "tarefa_cronograma_id" INTEGER ;

-- CreateTable
CREATE TABLE "tarefa_cronograma" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER,
    "transferencia_id" INTEGER,
    "previsao_inicio" DATE,
    "previsao_termino" DATE,
    "previsao_duracao" INTEGER,
    "realizado_inicio" DATE,
    "realizado_termino" DATE,
    "realizado_duracao" INTEGER,
    "realizado_custo" DOUBLE PRECISION,
    "projecao_termino" DATE,
    "tolerancia_atraso" INTEGER NOT NULL DEFAULT 0,
    "em_atraso" BOOLEAN NOT NULL DEFAULT false,
    "atraso" INTEGER,
    "percentual_concluido" INTEGER,
    "percentual_atraso" INTEGER,
    "status_cronograma" TEXT,
    "criado_em" TIMESTAMP(3),
    "criado_por" INTEGER,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,
    "atualizado_em" TIMESTAMP(3),

    CONSTRAINT "tarefa_cronograma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tarefa_cronograma_projeto_id_idx" ON "tarefa_cronograma"("projeto_id");

-- CreateIndex
CREATE INDEX "tarefa_cronograma_transferencia_id_idx" ON "tarefa_cronograma"("transferencia_id");

-- CreateIndex
CREATE INDEX "tarefa_tarefa_cronograma_id_removido_em_idx" ON "tarefa"("tarefa_cronograma_id", "removido_em");

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_tarefa_cronograma_id_fkey" FOREIGN KEY ("tarefa_cronograma_id") REFERENCES "tarefa_cronograma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_cronograma" ADD CONSTRAINT "tarefa_cronograma_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_cronograma" ADD CONSTRAINT "tarefa_cronograma_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "Transferencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_cronograma" ADD CONSTRAINT "tarefa_cronograma_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_cronograma" ADD CONSTRAINT "tarefa_cronograma_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tarefa_cronograma" ADD previsao_custo DOUBLE PRECISION;

insert into tarefa_cronograma (id, projeto_id, previsao_inicio,previsao_termino,previsao_duracao,realizado_inicio,realizado_termino,realizado_duracao,realizado_custo,projecao_termino,tolerancia_atraso,em_atraso,atraso,percentual_concluido,percentual_atraso,status_cronograma,previsao_custo)
select distinct projeto_id + 10000, projeto_id, p.previsao_inicio,p.previsao_termino,p.previsao_duracao,p.realizado_inicio,p.realizado_termino,p.realizado_duracao,p.realizado_custo,p.projecao_termino,p.tolerancia_atraso,p.em_atraso,p.atraso,p.percentual_concluido,p.percentual_atraso,p.status_cronograma,p.previsao_custo
from tarefa a join projeto p on p.id=projeto_id  where tarefa_pai_id is null;

update tarefa set tarefa_cronograma_id = projeto_id + 10000;

select setval('tarefa_cronograma_id_seq'::regclass, (select max(id) from tarefa_cronograma) + 1, false);

ALTER TABLE "tarefa" alter column tarefa_cronograma_id set NOT NULL;

ALTER TABLE "tarefa_cronograma" ADD COLUMN "tarefas_proximo_recalculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW view_projeto_custo_categoria_uso_corrente AS
SELECT * from view_projeto_custo_categoria

UNION ALL
SELECT
    'Custo previsto até o momento',
    sum(custo_estimado) AS valor,
    b.projeto_id as id
FROM
    tarefa a
    join tarefa_cronograma b on b.id = a.tarefa_cronograma_id
WHERE
    termino_planejado <= now() at time zone 'America/Sao_Paulo'
and custo_estimado is not null
and tarefa_pai_id is null
and b.removido_em is null
group by 1,3;

-- AlterTable
ALTER TABLE "tarefa" DROP COLUMN "projeto_id";

alter table "Transferencia" rename to "transferencia";

CREATE OR REPLACE FUNCTION f_tgr_update_ano_projeto_trigger()
    RETURNS TRIGGER
    AS $$
DECLARE
 tmp INTEGER;
BEGIN

    SELECT projeto_id into tmp
    from tarefa_cronograma
    where id = NEW.tarefa_cronograma_id;

    if (tmp is not null) then
        PERFORM atualiza_ano_orcamento_projeto(tmp);
    end if;

    RETURN NEW;
END;
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


    IF (v_projeto_id IS NOT NULL) THEN
        -- isso aqui provavelmente vai mudar mais pra frente, mas por enquanto, vamos atualizar o projeto tbm
        -- nem todos os campos do projeto vão sofrer alteração pela trigger
        -- alguns campos poderíamos inclusive apagar, e ir buscar através do join, mas para beneficiar o
        -- o processo de migração, vou deixar na tabela por enquanto
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

        WHERE p.id = v_projeto_id
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
    END IF;

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
