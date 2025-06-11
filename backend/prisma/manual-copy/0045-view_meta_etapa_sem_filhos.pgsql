create or replace view view_meta_etapa_sem_filhos as
select
sub.cronograma_id,
e.id,
vmc.meta_id
from view_meta_cronograma vmc
join etapa  e on e.cronograma_id = vmc.cronograma_id and e.removido_em is null

join (
select vmc.meta_id, vmc.cronograma_id, b.id, (select count(1) from etapa x where x.etapa_pai_id = b.id and x.removido_em is null) as filhos
from  cronograma_etapa a
join etapa b on b.id = a.etapa_id and b.removido_em is null
join view_meta_cronograma vmc on vmc.cronograma_id = a.cronograma_id
where a.inativo = false
and b.etapa_pai_id is null

    union all

select vmc.meta_id, vmc.cronograma_id, fase.id, (select count(1) from etapa x where x.etapa_pai_id = fase.id and x.removido_em is null) as filhos
from  cronograma_etapa a
join etapa e on e.id = a.etapa_id and e.removido_em is null
join etapa fase on fase.etapa_pai_id = e.id and fase.removido_em is null
join view_meta_cronograma vmc on vmc.cronograma_id = a.cronograma_id
where a.inativo = false
and e.etapa_pai_id is null

    union all

select vmc.meta_id, vmc.cronograma_id, subfase.id, (select count(1) from etapa x where x.etapa_pai_id = subfase.id and x.removido_em is null) as filhos
from  cronograma_etapa a
join etapa e on e.id = a.etapa_id and e.removido_em is null
join etapa fase on fase.etapa_pai_id = e.id and fase.removido_em is null
join etapa subfase on subfase.etapa_pai_id = fase.id and subfase.removido_em is null
join view_meta_cronograma vmc on vmc.cronograma_id = a.cronograma_id
where a.inativo = false
and e.etapa_pai_id is null

) sub on sub.id = e.id and sub.filhos = 0 and sub.cronograma_id = e.cronograma_id and vmc.meta_id = sub.meta_id

--where vmc.meta_id = 202

