create or replace view view_projetos as
select
    *,
case
when p.status = 'Registrado' then  'Registrado'
when p.status = 'Selecionado' then  'Selecionado'
when p.status = 'EmPlanejamento' then  'Em Planejamento'
when p.status = 'Planejado' then  'Planejado'
when p.status = 'Validado' then  'Validado'
when p.status = 'EmAcompanhamento' then  'Em Acompanhamento'
when p.status = 'Suspenso' then  'Suspenso'
when p.status = 'Fechado' then  'Fechado'
end as "Status",

case when previsao_custo > 0 then
    round((realizado_custo::numeric / previsao_custo::numeric) * 100.0)
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
end as "numero_status"


from projeto p
where p.removido_em IS NULL
order by p.status, p.codigo;
-- isso vai garantir a ordem do enum (Registrado, Selecionado, EmPlanejamento, Planejado, Validado, EmAcompanhamento, Suspenso, Fechado)
-- e depois o código

--------

CREATE OR REPLACE VIEW view_projeto_custo_categoria AS
SELECT
    'Custo Realizado' AS categoria,
    realizado_custo AS valor,
    id
FROM
    projeto
WHERE
    realizado_custo IS NOT NULL
UNION ALL
SELECT
    'Custo Previsto',
    previsao_custo AS valor,
    id
FROM
    projeto
WHERE
    previsao_custo IS NOT NULL;

--------

CREATE OR REPLACE VIEW view_projeto_custo_categoria_uso_corrente AS
SELECT * from view_projeto_custo_categoria

UNION ALL
SELECT
    'Custo previsto até o momento',
    sum(custo_estimado) AS valor,
    projeto_id as id
FROM
    tarefa
WHERE
    termino_planejado <= now() at time zone 'America/Sao_Paulo'
and custo_estimado is not null
group by 1,3;

--

create or replace view view_status_realizacao_metas AS
select
    meta.pdm_id, meta.id,

    serie.meta_prevista,
    serie.meta_parcial,
    serie.meta_realizada,

   -- case when pra evitar division by zero
    case when (coalesce(serie.meta_realizada, 0) - coalesce(indicador.acumulado_valor_base, 0)) = 0
    then 0
    else round((
        (serie.meta_realizada - coalesce(indicador.acumulado_valor_base,0)) / (serie.meta_prevista - coalesce(indicador.acumulado_valor_base, 0))
      ) * 100)
    end as percetual_execucao,
    case when coalesce(serie.meta_realizada, 0) >= coalesce(serie.meta_prevista, 1)
        then 'Atingida' else 'Não Atingida'
    end AS status_meta,
    meta.macro_tema_id, meta.tema_id
from meta
inner join indicador on indicador.meta_id = meta.id and indicador.removido_em is null
left join (
   -- o sum garante que vai sempre ter apenas 1 linha pra cada indicador, logo, 1 linha pra cada meta!
   select
     x.indicador_id,
     sum(case when x.serie = 'PrevistoAcumulado' and x.posicao = 'T' then x.valor_nominal else 0 end) AS meta_prevista,
     sum(case when x.serie = 'PrevistoAcumulado' and x.posicao = 'P' then x.valor_nominal else 0 end) AS meta_parcial,
     sum(case when x.serie = 'RealizadoAcumulado' then x.valor_nominal else 0 end) AS meta_realizada
    FROM (
       select
         serie_indicador.indicador_id,
         serie_indicador.serie,
         serie_indicador.valor_nominal,
         serie_indicador.data_valor,
         'P' as posicao
       from indicador as i
       inner join serie_indicador on serie_indicador.indicador_id = i.id
       inner join meta as m on i.meta_id = m.id
       left join (select pdm_id, data_ciclo from ciclo_fisico where ativo = true) as ciclo on m.pdm_id = ciclo.pdm_id
       where serie_indicador.data_valor = (
           select max(data_valor) from serie_indicador as si
           where si.serie = serie_indicador.serie and si.indicador_id = serie_indicador.indicador_id
           and si.data_valor < coalesce(ciclo.data_ciclo, now() at time zone 'America/Sao_Paulo' )
           and si.ha_conferencia_pendente = false
       )
       and serie in ('PrevistoAcumulado', 'RealizadoAcumulado')
       union all
       select
         serie_indicador.indicador_id,
         serie_indicador.serie,
         serie_indicador.valor_nominal,
         serie_indicador.data_valor,
         'T' as posicao
       from indicador as i
       inner join serie_indicador on serie_indicador.indicador_id = i.id
       inner join meta as m on i.meta_id = m.id
       left join (select pdm_id, data_ciclo from ciclo_fisico where ativo = true) as ciclo on m.pdm_id = ciclo.pdm_id
       where serie_indicador.serie = 'PrevistoAcumulado'
       and serie_indicador.data_valor = (
           select max(data_valor) from serie_indicador as si
           where si.serie = 'PrevistoAcumulado' and si.indicador_id = serie_indicador.indicador_id
       )
     ) as x
     group by x.indicador_id
  ) as serie on serie.indicador_id = indicador.id
where meta.removido_em is null;


create or replace view view_metas_com_filtros AS
select
    m.pdm_id,
    m.id,
    m.meta_prevista,
    m.meta_parcial,
    m.meta_realizada,
    m.percetual_execucao,
    m.status_meta,

    eixo.descricao as macro_tema,
    objetivo_estrategico.descricao as tema,
    array_agg(distinct orgao.sigla order by orgao.sigla) as orgaos

from view_status_realizacao_metas m
inner join eixo on m.macro_tema_id = eixo.id
inner join objetivo_estrategico on m.tema_id = objetivo_estrategico.id
inner join meta_orgao on m.id = meta_orgao.meta_id
inner join orgao on meta_orgao.orgao_id = orgao.id

group by 1,2,3,4,5,6,7,8,9;