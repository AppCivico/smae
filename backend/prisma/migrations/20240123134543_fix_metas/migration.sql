

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
    WHERE mo.removido_em IS NULL AND mo.ultima_revisao = true
    GROUP BY 1, 2, 3, 4
) AS prev_cust ON prev_cust.ano_referencia = x.ano and prev_cust.meta_id = m.id
AND ( -- versao reduizada da subquery do plan_ano, sem os joins/regexp
        SELECT count(1)
        FROM orcamento_planejado me
        WHERE me.meta_id = m.id and removido_em is null
        AND me.ano_referencia = x.ano
) = 0
where coalesce(plan_ano.valor, prev_cust.valor) is not null;


create or replace view view_variaveis_pdm_preenchimento as
with variaveis_mes as (
    select
        vv.meta_id,
        vv.variavel_id,
        date_trunc('month', sv.data_valor + ( v.atraso_meses || 'month')::interval) as data_referencia,
        count(1) as total_disponivel
    from view_variaveis_pdm vv
    join variavel v on v.id = vv.variavel_id
    join serie_variavel sv on sv.variavel_id = vv.variavel_id and sv.serie = 'PrevistoAcumulado'
    group by 1, 2, 3
)
select
    vm.meta_id,
    vm.variavel_id,
    vm.data_referencia,
    1 as disponivel,
    sum(case when vcfq.variavel_id is not null then 1 else 0 end) as preenchida,
    date_part('year',vm.data_referencia) as ano_referencia

from variaveis_mes vm
left join variavel_ciclo_fisico_qualitativo as vcfq on
    -- pra não ter que descontar a latencia e comparar com o mes que foi preenchida de fato
    -- mas qualquer coisa, fazer um join na variaveis, trazer a referencia data_valor original da serie
    -- pra fazer esse cruzamento
    date_trunc('month', vcfq.criado_em AT TIME ZONE 'America/Sao_Paulo')
         = vm.data_referencia and vcfq.variavel_id = vm.variavel_id and vcfq.removido_em is null and vcfq.ultima_revisao = true
group by 1, 2, 3, 4;

