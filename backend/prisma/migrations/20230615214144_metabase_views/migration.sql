drop view if exists view_projetos;
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
and tarefa_pai_id is null
group by 1,3;

--

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
    string_agg(distinct orgao.sigla , ', ' order by orgao.sigla ) as orgaos,
    titulo_meta as titulo_meta
    --array_agg(distinct orgao.sigla order by orgao.sigla ) as orgaos
    --jsonb_object_agg(distinct orgao.sigla, true order by orgao.sigla ) as orgaos

from view_status_realizacao_metas m
inner join eixo on m.macro_tema_id = eixo.id
inner join objetivo_estrategico on m.tema_id = objetivo_estrategico.id
inner join meta_orgao on m.id = meta_orgao.meta_id
inner join orgao on meta_orgao.orgao_id = orgao.id

group by 1,2,3,4,5,6,7,8,9,11;
update projeto set tarefas_proximo_recalculo=now();


DROP MATERIALIZED VIEW IF EXISTS sof_entidades_linhas CASCADE;
CREATE MATERIALIZED VIEW sof_entidades_linhas AS
WITH dict AS (
    SELECT
        ano,
        array_agg(json_keys) AS keys
    FROM (
        SELECT
            json_object_keys(dados) AS json_keys,
            ano
        FROM
            sof_entidade) a
    WHERE
        json_keys IN ('projetos_atividades', 'unidades', 'fonte_recursos', 'orgaos')
        -- json_keys not in ('metadados')
    GROUP BY
        ano
),
exploded AS (
    SELECT
        ano,
        unnest(keys) AS k
    FROM
        dict
),
lists AS (
    SELECT
        sof.ano,
        e.k AS col,
        json_extract_path(sof.dados, e.k) AS arr
    FROM
        exploded e
        JOIN sof_entidade sof ON sof.ano = e.ano
),
lines AS (
    SELECT
        ano,
        col,
        trim((json_array_elements(arr)) ->> 'codigo') AS codigo,
        (json_array_elements(arr)) ->> 'cod_orgao' AS cod_orgao,

        regexp_replace(
            regexp_replace(trim((json_array_elements(arr)) ->> 'descricao'), '\s+', ' ', 'g'), '''', '´', 'g'
        ) AS descricao
    FROM
        lists
)
SELECT
    ano,
    col,
    coalesce(codigo, '') AS codigo,
    coalesce(cod_orgao, '') AS cod_orgao,
    string_agg(distinct descricao, ' / ' ORDER BY descricao) AS descricao
FROM
    lines
GROUP BY
    1,
    2,
    3,
    4;

/*
WITH upper_case_counts AS (
  SELECT descricao, lower(descricao) AS lower_descricao, count_upper_case_chars(descricao) AS num_upper_case
  FROM sof_entidades_linhas
  WHERE col = 'orgaos'
),
min_upper_case_counts AS (
  SELECT lower_descricao, MIN(num_upper_case) AS min_num_upper_case
  FROM upper_case_counts
  GROUP BY lower_descricao
)
SELECT ucc.descricao
FROM upper_case_counts AS ucc
JOIN min_upper_case_counts AS mucc
ON ucc.lower_descricao = mucc.lower_descricao AND ucc.num_upper_case = mucc.min_num_upper_case;
*/

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
pdm_id, ano, id,
sum(valor_empenhado) filter (where valor_empenhado is not null) as valor_empenhado,
sum(valor_liquidado) filter (where valor_liquidado is not null) as valor_liquidado,
acao_orcamentaria,
orgao_sof,
sum(qtde) as qtde,
sum(valor_planejado) filter (where valor_planejado is not null) as valor_planejado
from myq
group by 1,2,3,6,7;
--
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
         = vm.data_referencia and vcfq.variavel_id = vm.variavel_id and vcfq.removido_em is null
group by 1, 2, 3, 4;

--

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

-- função usada pra normalizar os dados da query de auto-complete do orgão do sof
CREATE OR REPLACE FUNCTION count_upper_case_chars(_input TEXT)
RETURNS INTEGER AS $$
DECLARE
    count_upper INTEGER := 0;
    char_idx INTEGER := 0;
    current_char CHAR(1);
BEGIN
    FOR char_idx IN 1..length(_input)
    LOOP
        current_char := substring(_input FROM char_idx FOR 1);
        IF current_char = UPPER(current_char) AND current_char != LOWER(current_char) THEN
            count_upper := count_upper + 1;
        END IF;
    END LOOP;
    RETURN count_upper;
END;
$$ LANGUAGE plpgsql;
