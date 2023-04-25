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
end as "Status"

from projeto p;