create or replace view view_projetos as
select
    p.id,
null::int as meta_id,
null::int as iniciativa_id,
null::int as atividade_id,
p.codigo,
p.nome,
p.objeto,
p.objetivo,
false as origem_eh_pdm,
null::text as origem_outro,
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
null::text as meta_codigo,
null::"ProjetoOrigemTipo" as origem_tipo,
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
-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_atividade_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_iniciativa_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_meta_id_fkey";

-- CreateTable
CREATE TABLE "projeto_origem" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "origem_tipo" "ProjetoOrigemTipo" NOT NULL DEFAULT 'Outro',
    "origem_eh_pdm" BOOLEAN NOT NULL DEFAULT false,
    "origem_outro" TEXT,
    "meta_codigo" TEXT,
    "meta_id" INTEGER,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER,
    "atualizado_em" TIMESTAMP(3),
    "atualizado_por" INTEGER,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "projeto_origem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

alter table projeto add column cache_metas json not null default '{}'::json;

insert into projeto_origem (projeto_id, origem_tipo, origem_eh_pdm, origem_outro, meta_codigo, meta_id, iniciativa_id, atividade_id, criado_em)
select
    id, origem_tipo, origem_eh_pdm, origem_outro, meta_codigo, meta_id, iniciativa_id, atividade_id,
    registrado_em
from projeto;
