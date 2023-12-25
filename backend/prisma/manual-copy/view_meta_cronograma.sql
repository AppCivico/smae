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
