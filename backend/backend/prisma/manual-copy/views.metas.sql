create or replace view view_meta_orcamento_plan as
select
    x.pdm_id,
    x.ano,
    m.id,
    coalesce(plan_ano.valor, prev_cust.valor) as valor,
    coalesce(plan_ano.acao_orcamentaria, prev_cust.acao_orcamentaria) as acao_orcamentaria,
    coalesce(plan_ano.orgao_sof, prev_cust.orgao_sof) as orgao_sof,
    coalesce(plan_ano.qtde, prev_cust.qtde) as qtde
from (
    select
        pdm.id as pdm_id,
        extract('year' from x.x)::int as ano
    FROM pdm
    cross join generate_series(pdm.data_inicio, pdm.data_fim, '1 year'::interval) x
) as x
inner join meta m on m.pdm_id = x.pdm_id and m.removido_em is null
left join (
    select
        meta_id,
        ano_referencia,
        coalesce(  sof.descricao, 'Código ' || SPLIT_PART(dotacao, '.', 1) ) as orgao_sof,
            CASE WHEN SPLIT_PART(dotacao, '.', 6) ~ '^[0-9]+$'
                AND CAST(SPLIT_PART(dotacao, '.', 6) AS INTEGER) % 2 = 0
                    THEN 'custeio'
            WHEN SPLIT_PART(dotacao, '.', 6) ~ '^[0-9]+$'
                    THEN 'investimento'
            ELSE NULL
        END AS acao_orcamentaria,
        sum(valor_planejado) as valor,
        count(1) as qtde
    FROM orcamento_planejado op
    LEFT JOIN sof_entidades_linhas sof ON sof.col='orgaos' and sof.ano=op.ano_referencia
        and sof.codigo = SPLIT_PART(dotacao, '.', 1)
    WHERE op.removido_em IS NULL
    GROUP BY 1, 2, 3, 4
) AS plan_ano ON plan_ano.ano_referencia = x.ano and plan_ano.meta_id = m.id
left join (
    select
        meta_id,
        ano_referencia,
        coalesce(  sof.descricao, 'Código ' || SPLIT_PART(parte_dotacao, '.', 1) ) as orgao_sof,
            CASE WHEN SPLIT_PART(parte_dotacao, '.', 6) ~ '^[0-9]+$'
                AND CAST(SPLIT_PART(parte_dotacao, '.', 6) AS INTEGER) % 2 = 0
                    THEN 'custeio'
            WHEN SPLIT_PART(parte_dotacao, '.', 6) ~ '^[0-9]+$'
                    THEN 'investimento'
            ELSE NULL
        END AS acao_orcamentaria,
        sum(custo_previsto) as valor,
        count(1) as qtde
    FROM meta_orcamento mo
    LEFT JOIN sof_entidades_linhas sof ON sof.col='orgaos' and sof.ano=mo.ano_referencia
        and sof.codigo = SPLIT_PART(parte_dotacao, '.', 1)
    WHERE mo.removido_em IS NULL
    GROUP BY 1, 2, 3, 4
) AS prev_cust ON prev_cust.ano_referencia = x.ano and prev_cust.meta_id = m.id
AND ( -- versao reduizada da subquery do plan_ano, sem os joins/regexp
        SELECT count(1)
        FROM orcamento_planejado me
        WHERE me.meta_id = m.id and removido_em is null
        AND me.ano_referencia = x.ano
) = 0
where coalesce(plan_ano.valor, prev_cust.valor) is not null;
---

create or replace view view_meta_orcamento_realizado as
with myq as (
    select
        x.pdm_id,
        x.ano,
        m.id,
        realizado_ano.soma_valor_empenho as valor_empenhado,
        realizado_ano.soma_valor_liquidado as valor_liquidado,
        realizado_ano.acao_orcamentaria,
        realizado_ano.orgao_sof,
        realizado_ano.qtde,
        null::numeric as valor_planejado
    from (
        select
            pdm.id as pdm_id,
            extract('year' from x.x)::int as ano
        FROM pdm
        cross join generate_series(pdm.data_inicio, pdm.data_fim, '1 year'::interval) x
    ) as x
    inner join meta m on m.pdm_id = x.pdm_id and m.removido_em is null
    inner join (
        select
            meta_id,
            ano_referencia,
            coalesce(  sof.descricao, 'Código ' || SPLIT_PART(dotacao, '.', 1) ) as orgao_sof,
                CASE WHEN SPLIT_PART(dotacao, '.', 6) ~ '^[0-9]+$'
                    AND CAST(SPLIT_PART(dotacao, '.', 6) AS INTEGER) % 2 = 0
                        THEN 'custeio'
                WHEN SPLIT_PART(dotacao, '.', 6) ~ '^[0-9]+$'
                        THEN 'investimento'
                ELSE NULL
            END AS acao_orcamentaria,
            sum(soma_valor_empenho::numeric) as soma_valor_empenho,
            sum(soma_valor_liquidado::numeric) as soma_valor_liquidado,
            count(1) as qtde
        FROM orcamento_realizado o_r
        LEFT JOIN sof_entidades_linhas sof ON sof.col='orgaos' and sof.ano=o_r.ano_referencia
            and sof.codigo = SPLIT_PART(dotacao, '.', 1)
        WHERE o_r.removido_em IS NULL
        GROUP BY 1, 2, 3, 4
    ) AS realizado_ano ON realizado_ano.ano_referencia = x.ano and realizado_ano.meta_id = m.id
union all
    select
        pdm_id, ano,
        id,
        null::numeric,
        null::numeric,
        acao_orcamentaria,
        orgao_sof,
        qtde,
        valor
    from view_meta_orcamento_plan m
)
-- collapse pro resultado do mesmo ano/meta/orgao/acao ficar na mesma linha, mas
-- talvez não seja necessário pro metabase, podemos tirar pra evitar esse processamento a toa
select
    x.*,
    case when valor_planejado is not null
    and valor_empenhado is not null
    and valor_planejado != 0 then
        round(valor_empenhado::numeric/valor_planejado::numeric)*100
    end as percentual_execucao
from (
    select
    pdm_id, ano, id,
    sum(valor_empenhado) filter (where valor_empenhado is not null) as valor_empenhado,
    sum(valor_liquidado) filter (where valor_liquidado is not null) as valor_liquidado,
    acao_orcamentaria,
    orgao_sof,
    sum(qtde) as qtde,
    sum(valor_planejado) filter (where valor_planejado is not null) as valor_planejado
    from myq
    group by 1,2,3,6,7
) x;
