/*
  Warnings:

  - You are about to drop the column `atraso` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `em_atraso` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `percentual_atraso` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `percentual_concluido` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `projecao_termino` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `realizado_custo` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `realizado_duracao` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `realizado_inicio` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `realizado_termino` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `status_cronograma` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `tolerancia_atraso` on the `projeto` table. All the data in the column will be lost.

*/

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



-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "atraso",
DROP COLUMN "em_atraso",
DROP COLUMN "percentual_atraso",
DROP COLUMN "percentual_concluido",
DROP COLUMN "projecao_termino",
DROP COLUMN "realizado_custo",
DROP COLUMN "realizado_duracao",
DROP COLUMN "realizado_inicio",
DROP COLUMN "realizado_termino",
DROP COLUMN "status_cronograma",
DROP COLUMN "tolerancia_atraso",
DROP COLUMN "tarefas_proximo_recalculo";


-- AlterTable
ALTER TABLE "transferencia" RENAME CONSTRAINT "Transferencia_pkey" TO "transferencia_pkey";

-- RenameForeignKey
ALTER TABLE "transferencia" RENAME CONSTRAINT "Transferencia_atualizado_por_fkey" TO "transferencia_atualizado_por_fkey";

-- RenameForeignKey
ALTER TABLE "transferencia" RENAME CONSTRAINT "Transferencia_criado_por_fkey" TO "transferencia_criado_por_fkey";

-- RenameForeignKey
ALTER TABLE "transferencia" RENAME CONSTRAINT "Transferencia_orgao_concedente_id_fkey" TO "transferencia_orgao_concedente_id_fkey";

-- RenameForeignKey
ALTER TABLE "transferencia" RENAME CONSTRAINT "Transferencia_parlamentar_id_fkey" TO "transferencia_parlamentar_id_fkey";

-- RenameForeignKey
ALTER TABLE "transferencia" RENAME CONSTRAINT "Transferencia_partido_id_fkey" TO "transferencia_partido_id_fkey";

-- RenameForeignKey
ALTER TABLE "transferencia" RENAME CONSTRAINT "Transferencia_removido_por_fkey" TO "transferencia_removido_por_fkey";

-- RenameForeignKey
ALTER TABLE "transferencia" RENAME CONSTRAINT "Transferencia_secretaria_concedente_id_fkey" TO "transferencia_secretaria_concedente_id_fkey";

-- RenameForeignKey
ALTER TABLE "transferencia" RENAME CONSTRAINT "Transferencia_tipo_id_fkey" TO "transferencia_tipo_id_fkey";

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
