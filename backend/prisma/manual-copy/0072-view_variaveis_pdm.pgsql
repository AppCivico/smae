create or replace view view_variaveis_pdm as
     -- indicadores do pdm
    select
    m.pdm_id,
        im.id as indicador_id,
        m.id as meta_id,
        iv.variavel_id
    from meta m
    join indicador im on im.meta_id = m.id and im.removido_em is null
    join indicador_variavel iv on iv.indicador_id = im.id and iv.desativado_em is null and iv.indicador_origem_id is null
    where  m.ativo = TRUE
    and m.removido_em is null
    UNION ALL
    select
    m.pdm_id,
        ii.id as indicador_id,
        m.id as meta_id,
        iv.variavel_id
    from meta m
    join iniciativa i on i.meta_id = m.id and i.removido_em is null
    join indicador ii on ii.iniciativa_id = i.id and ii.removido_em is null
    join indicador_variavel iv on iv.indicador_id = ii.id and iv.desativado_em is null  and iv.indicador_origem_id is null
    where  m.ativo = TRUE
    and m.removido_em is null
    UNION ALL
    select
    m.pdm_id,
        ia.id as indicador_id,
        m.id as meta_id,
        iv.variavel_id
    from meta m
    join iniciativa i on i.meta_id = m.id and i.removido_em is null
    join atividade a on a.iniciativa_id = i.id and a.removido_em is null
    join indicador ia on ia.atividade_id = a.id and ia.removido_em is null
    join indicador_variavel iv on iv.indicador_id = ia.id and iv.desativado_em is null and iv.indicador_origem_id is null
    where
    m.ativo = TRUE
    and m.removido_em is null;

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

create or replace view view_variaveis_pdm_ciclo_ativo_por_orgao as
with variaveis_mes as (
    select
        vv.meta_id,
        vv.variavel_id,
        ov.sigla,
        date_trunc('month', sv.data_valor + ( v.atraso_meses || 'month')::interval) as data_referencia,
        count(1) as total_disponivel
    from view_variaveis_pdm vv
    join ciclo_fisico cf on cf.ativo and cf.pdm_id = vv.pdm_id
    join variavel v on v.id = vv.variavel_id
    join orgao ov on ov.id = v.orgao_id
    join serie_variavel sv on sv.variavel_id = vv.variavel_id and sv.serie = 'PrevistoAcumulado'
    and date_trunc('month', sv.data_valor + ( v.atraso_meses || 'month')::interval) = cf.data_ciclo
    group by 1, 2, 3, 4
)
select
    vm.meta_id,
    vm.variavel_id,
    vm.sigla,
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
         = vm.data_referencia and vcfq.variavel_id = vm.variavel_id and vcfq.removido_em is null
group by 1, 2, 3, 4, 5;
