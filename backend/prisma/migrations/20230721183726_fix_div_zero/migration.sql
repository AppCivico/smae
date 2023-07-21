create or replace view view_status_realizacao_metas AS
select
    meta.pdm_id, meta.id,

    serie.meta_prevista,
    serie.meta_parcial,
    serie.meta_realizada,


    coalesce(round((
        (serie.meta_realizada - coalesce(indicador.acumulado_valor_base, 0))
            /
        nullif(
            (serie.meta_prevista - coalesce(indicador.acumulado_valor_base, 0)),
            0
        )
    ) * 100), 0) as percetual_execucao,

    /*case when coalesce(serie.meta_realizada, 0) >= coalesce(serie.meta_prevista, 1)
        then 'Atingida' else 'Não Atingida'
    end*/
    coalesce((
        select t.descricao
        from ods a
        join tag t on t.ods_id = a.id
        join meta_tag mt on mt.meta_id = meta.id and mt.tag_id = t.id
        where a.titulo = 'Status'
        order by t.descricao
        limit 1
    ), 'Não Informado') AS status_meta,
    meta.macro_tema_id, meta.tema_id,
    meta.titulo as titulo_meta
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