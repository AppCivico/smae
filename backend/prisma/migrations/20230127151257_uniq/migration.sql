begin;

update pdm me set ativo = (SELECT id from pdm where ativo order by atualizado_por desc limit 1) = me.id;

update ciclo_fisico set ativo = false where ativo;

update ciclo_fisico set ativo = false,
acordar_ciclo_em = null,
ciclo_fase_atual_id= null
where ativo;

update ciclo_fisico
set acordar_ciclo_em = now()
where pdm_id = (select id from pdm where ativo)
AND data_ciclo = date_trunc('month', now() at time zone 'America/Sao_Paulo');


create unique index ix_ciclo_fisico_uniq_ativo on ciclo_fisico(ativo) where ativo=true;
create unique index ix_pdm_uniq_ativo on pdm(ativo) where ativo=true;


commit;
