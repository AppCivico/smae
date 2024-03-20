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

create or replace view view_projetos as
select
    p.id,
p.meta_id,
p.iniciativa_id,
p.atividade_id,
p.codigo,
p.nome,
p.objeto,
p.objetivo,
p.origem_eh_pdm,
p.origem_outro,
p.publico_alvo,
coalesce(tc.previsao_inicio, p.previsao_inicio) as previsao_inicio,
coalesce(tc.previsao_termino, p.previsao_termino) as previsao_termino,
coalesce(tc.previsao_duracao, p.previsao_duracao) as previsao_duracao,
coalesce(tc.previsao_custo, p.previsao_custo) as previsao_custo,
p.status,
p.fase,
p.arquivado,
p.eh_prioritario,
p.escopo,
p.nao_escopo,
p.secretario_responsavel,
p.secretario_executivo,
p.coordenador_ue,
p.data_aprovacao,
p.versao,
p.suspenso_em,
p.suspenso_por,
p.arquivado_em,
p.arquivado_por,
p.cancelado_em,
p.cancelado_por,
p.reiniciado_em,
p.reiniciado_por,
p.iniciado_em,
p.iniciado_por,
tc.realizado_inicio,
tc.realizado_termino,
tc.realizado_custo,
p.principais_etapas,
p.resumo,
p.em_planejamento_em,
p.em_planejamento_por,
p.orgao_gestor_id,
p.orgao_responsavel_id,
p.registrado_em,
p.registrado_por,responsaveis_no_orgao_gestor,
p.responsavel_id,
p.selecionado_em,
p.selecionado_por,
p.portfolio_id,
p.removido_em,
p.removido_por,
p.meta_codigo,
p.origem_tipo,
p.data_revisao,
p.finalizou_planejamento_em,
p.finalizou_planejamento_por,
p.restaurado_em,
p.restaurado_por,
p.terminado_em,
p.terminado_por,
p.validado_em,
p.validado_por,
tc.atraso,
tc.realizado_duracao,
tc.em_atraso,
tc.tolerancia_atraso,
tc.projecao_termino,
tc.percentual_concluido,
tc.tarefas_proximo_recalculo,
tc.percentual_atraso,
p.qtde_riscos,
p.risco_maximo,
tc.status_cronograma,
p.ano_orcamento,
case
when p.status = 'Registrado' then  'Registrado'
when p.status = 'Selecionado' then  'Selecionado'
when p.status = 'EmPlanejamento' then  'Em Planejamento'
when p.status = 'Planejado' then  'Planejado'
when p.status = 'Validado' then  'Validado'
when p.status = 'EmAcompanhamento' then  'Em Acompanhamento'
when p.status = 'Suspenso' then  'Suspenso'
when p.status = 'Fechado' then  'Concluído'
end as "Status",

case when coalesce(tc.previsao_custo, p.previsao_custo) > 0 then
    round((tc.realizado_custo::numeric / coalesce(tc.previsao_custo, p.previsao_custo)::numeric) * 100.0)
else null
end as percentual_custo_realizado,

case
when p.status = 'Registrado' then  1
when p.status = 'Selecionado' then  2
when p.status = 'EmPlanejamento' then 3
when p.status = 'Planejado' then  4
when p.status = 'Validado' then  5
when p.status = 'EmAcompanhamento' then  6
when p.status = 'Suspenso' then   6
when p.status = 'Fechado' then  7
end as "numero_status",
array_agg(distinct po.titulo) as portfolios_compartilhados

from projeto p
left join (
    select ppc.projeto_id, po.titulo
    from portfolio_projeto_compartilhado ppc
    join portfolio po on po.id = ppc.portfolio_id
    where ppc.removido_em IS NULL
    union all
    select p.id as projeto_id, po.titulo
    from projeto p
    join portfolio po on po.id = p.portfolio_id
) po on po.projeto_id = p.id
left join tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
where p.removido_em IS NULL
group by p.id, tc.id
order by p.status, p.codigo;
-- isso vai garantir a ordem do enum (Registrado, Selecionado, EmPlanejamento, Planejado, Validado, EmAcompanhamento, Suspenso, Fechado)
-- e depois o código

--------

CREATE OR REPLACE VIEW view_projeto_custo_categoria AS
SELECT
    'Custo Realizado' AS categoria,
    tc.realizado_custo AS valor,
    p.id
FROM
    projeto p
left join tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
WHERE
    tc.realizado_custo IS NOT NULL
UNION ALL
SELECT
    'Custo Previsto',
    coalesce(tc.previsao_custo, p.previsao_custo) AS valor,
    p.id
FROM
    projeto p
left join tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
WHERE
    coalesce(tc.previsao_custo, p.previsao_custo) IS NOT NULL;

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
