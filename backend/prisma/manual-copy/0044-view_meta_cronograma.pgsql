create or replace view view_meta_cronograma as
select
    m.id as meta_id,
    im.id as cronograma_id
from meta m
join cronograma im on im.meta_id = m.id and im.removido_em is null
where m.ativo = TRUE
and m.removido_em is null
    UNION ALL
select
    m.id as meta_id,
    ii.id as cronograma_id
from meta m
join iniciativa i on i.meta_id = m.id and i.removido_em is null
join cronograma ii on ii.iniciativa_id = i.id and ii.removido_em is null
where  m.ativo = TRUE
and m.removido_em is null
    UNION ALL
select
    m.id as meta_id,
    ia.id as cronograma_id
from meta m
join iniciativa i on i.meta_id = m.id and i.removido_em is null
join atividade a on a.iniciativa_id = i.id and a.removido_em is null
join cronograma ia on ia.atividade_id = a.id and ia.removido_em is null
where m.ativo = TRUE
and m.removido_em is null;

create or replace view view_etapa_rel_meta AS
select
    b.id as etapa_id,
    m1.id as meta_id,
    i1.id as iniciativa_id,
    a1.id as atividade_id
from etapa b
join cronograma c on c.id = b.cronograma_id
left join atividade a1 on c.atividade_id is not null and a1.id = c.atividade_id
left join iniciativa i1 on i1.id = coalesce( c.iniciativa_id, a1.iniciativa_id )
join meta m1 on m1.id = coalesce( c.meta_id, i1.meta_id )
where  b.removido_em is null;


create or replace view view_etapa_rel_meta_indicador AS
WITH tipos AS (
    SELECT
        v.*,
        'atividade' AS tipo
    FROM view_etapa_rel_meta v
    UNION ALL
    SELECT
        v.*,
        'iniciativa' AS tipo
    FROM view_etapa_rel_meta v
    UNION ALL
    SELECT
        v.*,
        'meta' AS tipo
    FROM view_etapa_rel_meta v
)
SELECT
    tf.*,
    coalesce(ia.id, ii.id, im.id) AS indicador_id
FROM tipos tf
LEFT JOIN indicador ia ON ia.removido_em is null AND ia.atividade_id = tf.atividade_id
LEFT JOIN indicador ii ON ii.removido_em is null AND ii.iniciativa_id = tf.iniciativa_id
LEFT JOIN indicador im ON im.removido_em is null AND im.meta_id = tf.meta_id;
