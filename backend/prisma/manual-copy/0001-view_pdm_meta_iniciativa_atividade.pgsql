create or replace view view_pdm_meta_iniciativa_atividade as
select
    m.id as meta_id,
    m.pdm_id as pdm_id,
    null::int as iniciativa_id,
    null::int as atividade_id
from meta m
where m.removido_em is null
    UNION ALL
select
    m.id as meta_id,
    m.pdm_id as pdm_id,
    i.id as iniciativa_id,
    null::int as atividade_id
from meta m
join iniciativa i on i.meta_id = m.id and i.removido_em is null
where m.removido_em is null
    UNION ALL
select
    m.id as meta_id,
    m.pdm_id as pdm_id,
    i.id as iniciativa_id,
    a.id as atividade_id
from meta m
join iniciativa i on i.meta_id = m.id and i.removido_em is null
join atividade a on a.iniciativa_id = i.id and a.removido_em is null
where m.removido_em is null;
