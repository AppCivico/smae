create or replace view view_projetos as
select
    p.id,
p.meta_id,
p.iniciativa_id,
p.atividade_id,
p.codigo,
p.nome,
p.objeto,
p.objetivo,
p.origem_eh_pdm,
p.origem_outro,
p.publico_alvo,
coalesce(tc.previsao_inicio, p.previsao_inicio) as previsao_inicio,
coalesce(tc.previsao_termino, p.previsao_termino) as previsao_termino,
coalesce(tc.previsao_duracao, p.previsao_duracao) as previsao_duracao,
coalesce(tc.previsao_custo, p.previsao_custo) as previsao_custo,
p.status,
p.fase,
p.arquivado,
p.eh_prioritario,
p.escopo,
p.nao_escopo,
p.secretario_responsavel,
p.secretario_executivo,
p.coordenador_ue,
p.data_aprovacao,
p.versao,
p.suspenso_em,
p.suspenso_por,
p.arquivado_em,
p.arquivado_por,
p.cancelado_em,
p.cancelado_por,
p.reiniciado_em,
p.reiniciado_por,
p.iniciado_em,
p.iniciado_por,
tc.realizado_inicio,
tc.realizado_termino,
tc.realizado_custo,
p.principais_etapas,
p.resumo,
p.em_planejamento_em,
p.em_planejamento_por,
p.orgao_gestor_id,
p.orgao_responsavel_id,
p.registrado_em,
p.registrado_por,responsaveis_no_orgao_gestor,
p.responsavel_id,
p.selecionado_em,
p.selecionado_por,
p.portfolio_id,
p.removido_em,
p.removido_por,
p.meta_codigo,
p.origem_tipo,
p.data_revisao,
p.finalizou_planejamento_em,
p.finalizou_planejamento_por,
p.restaurado_em,
p.restaurado_por,
p.terminado_em,
p.terminado_por,
p.validado_em,
p.validado_por,
tc.atraso,
tc.realizado_duracao,
tc.em_atraso,
tc.tolerancia_atraso,
tc.projecao_termino,
tc.percentual_concluido,
tc.tarefas_proximo_recalculo,
tc.percentual_atraso,
p.qtde_riscos,
p.risco_maximo,
tc.status_cronograma,
p.ano_orcamento,
case
when p.status = 'Registrado' then  'Registrado'
when p.status = 'Selecionado' then  'Selecionado'
when p.status = 'EmPlanejamento' then  'Em Planejamento'
when p.status = 'Planejado' then  'Planejado'
when p.status = 'Validado' then  'Validado'
when p.status = 'EmAcompanhamento' then  'Em Acompanhamento'
when p.status = 'Suspenso' then  'Suspenso'
when p.status = 'Fechado' then  'Concluído'
end as "Status",

case when coalesce(tc.previsao_custo, p.previsao_custo) > 0 then
    round((tc.realizado_custo::numeric / coalesce(tc.previsao_custo, p.previsao_custo)::numeric) * 100.0)
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
end as "numero_status",
array_agg(distinct po.titulo) as portfolios_compartilhados

from projeto p
left join (
    select ppc.projeto_id, po.titulo
    from portfolio_projeto_compartilhado ppc
    join portfolio po on po.id = ppc.portfolio_id
    where ppc.removido_em IS NULL
    union all
    select p.id as projeto_id, po.titulo
    from projeto p
    join portfolio po on po.id = p.portfolio_id
) po on po.projeto_id = p.id
left join tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
where p.removido_em IS NULL
group by p.id, tc.id
order by p.status, p.codigo;
-- isso vai garantir a ordem do enum (Registrado, Selecionado, EmPlanejamento, Planejado, Validado, EmAcompanhamento, Suspenso, Fechado)
-- e depois o código
