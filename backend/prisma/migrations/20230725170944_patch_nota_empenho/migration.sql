begin;


update orcamento_realizado me
set nota_empenho = new_nota_empenho
from (
    select
       id,
       nota_empenho,
       cast(split_part(nota_empenho, '/', 1) as integer)::text
       || '/'
       || split_part(nota_empenho, '/', 2) as new_nota_empenho
    from
       orcamento_realizado
    where
       nota_empenho is not null
       and nota_empenho <> cast(split_part(nota_empenho, '/', 1) as integer)::text
       || '/'
       || split_part(nota_empenho, '/', 2)
) x
where me.nota_empenho != new_nota_empenho
and me.id = x.id;


update dotacao_processo_nota me
set dotacao_processo_nota = new_nota_empenho
from (
    select
       id,
       dotacao_processo_nota,
       cast(split_part(dotacao_processo_nota, '/', 1) as integer)::text
       || '/'
       || split_part(dotacao_processo_nota, '/', 2) as new_nota_empenho
    from
       dotacao_processo_nota
    where
       dotacao_processo_nota is not null
       and dotacao_processo_nota <> cast(split_part(dotacao_processo_nota, '/', 1) as integer)::text
       || '/'
       || split_part(dotacao_processo_nota, '/', 2)
) x
where me.dotacao_processo_nota != new_nota_empenho
and me.id = x.id;


update pdm_dotacao_processo_nota me
set dotacao_processo_nota = new_nota_empenho
from (
    select
       id,
       dotacao_processo_nota,
       cast(split_part(dotacao_processo_nota, '/', 1) as integer)::text
       || '/'
       || split_part(dotacao_processo_nota, '/', 2) as new_nota_empenho
    from
       pdm_dotacao_processo_nota
    where
       dotacao_processo_nota is not null
       and dotacao_processo_nota <> cast(split_part(dotacao_processo_nota, '/', 1) as integer)::text
       || '/'
       || split_part(dotacao_processo_nota, '/', 2)
) x
where me.dotacao_processo_nota != new_nota_empenho
and me.id = x.id;


update portfolio_dotacao_processo_nota me
set dotacao_processo_nota = new_nota_empenho
from (
    select
       id,
       dotacao_processo_nota,
       cast(split_part(dotacao_processo_nota, '/', 1) as integer)::text
       || '/'
       || split_part(dotacao_processo_nota, '/', 2) as new_nota_empenho
    from
       portfolio_dotacao_processo_nota
    where
       dotacao_processo_nota is not null
       and dotacao_processo_nota <> cast(split_part(dotacao_processo_nota, '/', 1) as integer)::text
       || '/'
       || split_part(dotacao_processo_nota, '/', 2)
) x
where me.dotacao_processo_nota != new_nota_empenho
and me.id = x.id;


delete from dotacao_processo_nota where length(dotacao) > 35;
delete from dotacao_processo where length(dotacao) > 35;
delete from dotacao_realizado where length(dotacao) > 35;
delete from dotacao_planejado where length(dotacao) > 35;


commit;
