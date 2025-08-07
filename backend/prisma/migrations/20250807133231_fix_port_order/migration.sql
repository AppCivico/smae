
update portfolio
set orcamento_execucao_disponivel_meses = (select array_agg(x. x order by x.x) from unnest(orcamento_execucao_disponivel_meses) as x(x)    )
where orcamento_execucao_disponivel_meses::varchar != (select array_agg(x. x order by x.x) from unnest(orcamento_execucao_disponivel_meses) as x(x)    )::varchar;

