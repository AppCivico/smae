-- This is an empty migration.
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
p.previsao_inicio,
p.previsao_termino,
p.previsao_duracao,
p.previsao_custo,
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
p.realizado_inicio,
p.realizado_termino,
p.realizado_custo,
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
p.atraso,
p.realizado_duracao,
p.em_atraso,
p.tolerancia_atraso,
p.projecao_termino,
p.percentual_concluido,
p.tarefas_proximo_recalculo,
p.percentual_atraso,
p.qtde_riscos,
p.risco_maximo,
p.status_cronograma,
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
end as "numero_status",
array_agg(po.titulo) as portfolios_compartilhados

from projeto p
left join portfolio_projeto_compartilhado ppc on ppc.projeto_id = p.id
left join portfolio po on po.id = ppc.portfolio_id
where p.removido_em IS NULL
and ppc.removido_em IS NULL
group by p.id, p.portfolio_id, p.status, previsao_custo, realizado_custo
order by p.status, p.codigo;