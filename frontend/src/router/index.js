import { createRouter, createWebHistory } from 'vue-router';

// Stores
import { useAuthStore } from '@/stores';

// Views
import { default as SubmenuMetas } from '@/components/SubmenuMetas.vue';
import { default as SubmenuMonitoramento } from '@/components/SubmenuMonitoramento.vue';
import { Home } from '@/views';

import { Login, LostPassword, NewPassword } from '@/views/auth';
import {
  AddEditAtividade,
  AddEditCronograma,
  AddEditIndicador,
  AddEditIniciativa,
  AddEditMetas,
  ListMetas,
  ListMetasGroup,
  SingleAtividade,
  SingleCronograma,
  SingleEvolucao,
  SingleIniciativa,
  SingleMeta, SinglePainelMeta
} from '@/views/metas';
import {
  ListCiclos, ListCiclosPassados,
  ListMonitoramentoMetas,
  ListMonitoramentoMetasCronograma,
  ListMonitoramentoMetasEvolucao,
  MonitoramentoMetas,
  MonitoramentoMetasCronograma
} from '@/views/monitoramento';
import {
  AddEditCusteio,
  AddEditPlanejado,
  AddRealizado,
  AddRealizadoNota,
  AddRealizadoProcesso,
  EditRealizado,
  MetaOrcamento
} from '@/views/orcamento';
import administracao from './administracao';

import relatorios from './relatorios';

// eslint-disable-next-line import/prefer-default-export
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: 'active',
  routes: [
    { path: '/', component: Home, props: { submenu: false } },
    { path: '/login', component: Login },
    { path: '/esqueci-minha-senha', component: LostPassword },
    { path: '/nova-senha', component: NewPassword },

    ...administracao,

    {
      path: '/monitoramento',
      children: [
        { path: '', redirect: '/monitoramento/evolucao' },
        { path: 'fases', component: ListMonitoramentoMetas, props: { submenu: SubmenuMonitoramento, parentPage: 'fases' } },
        { path: 'evolucao', component: ListMonitoramentoMetasEvolucao, props: { submenu: SubmenuMonitoramento, parentPage: 'evolucao' } },
        { path: 'evolucao/:meta_id', component: MonitoramentoMetas, props: { submenu: SubmenuMonitoramento, parentPage: 'evolucao' } },
        { path: 'cronograma', component: ListMonitoramentoMetasCronograma, props: { submenu: SubmenuMonitoramento, parentPage: 'cronograma' } },
        { path: 'cronograma/:meta_id', component: MonitoramentoMetasCronograma, props: { submenu: SubmenuMonitoramento, parentPage: 'cronograma' } },
        { path: 'cronograma/:meta_id/editar/:cron_id/:etapa_id', component: MonitoramentoMetasCronograma, props: { submenu: SubmenuMonitoramento, parentPage: 'cronograma' } },
        { path: 'cronograma/:meta_id/:iniciativa_id', component: MonitoramentoMetasCronograma, props: { submenu: SubmenuMonitoramento, parentPage: 'cronograma' } },
        { path: 'cronograma/:meta_id/:iniciativa_id/editar/:cron_id/:etapa_id', component: MonitoramentoMetasCronograma, props: { submenu: SubmenuMonitoramento, parentPage: 'cronograma' } },
        { path: 'cronograma/:meta_id/:iniciativa_id/:atividade_id', component: MonitoramentoMetasCronograma, props: { submenu: SubmenuMonitoramento, parentPage: 'cronograma' } },
        { path: 'cronograma/:meta_id/:iniciativa_id/:atividade_id/editar/:cron_id/:etapa_id', component: MonitoramentoMetasCronograma, props: { submenu: SubmenuMonitoramento, parentPage: 'cronograma' } },
        { path: 'ciclos', component: ListCiclos, props: { submenu: SubmenuMonitoramento, parentPage: 'ciclos' } },
        { path: 'ciclos/fechados', component: ListCiclosPassados, props: { submenu: SubmenuMonitoramento, parentPage: 'ciclos' } },
        { path: 'ciclos/:ciclo_id', component: ListCiclos, props: { submenu: SubmenuMonitoramento, parentPage: 'ciclos' } },
        { path: 'metas/:meta_id', component: MonitoramentoMetas, props: { submenu: SubmenuMonitoramento, parentPage: 'metas' } },
      ],
    },

    {
      path: '/metas',
      children: [
        { path: '', component: ListMetas },
        { path: 'novo', component: AddEditMetas, props: { type: 'novo', parentPage: 'metas' } },
        { path: 'editar/:meta_id', component: AddEditMetas, props: { type: 'editar', parentPage: 'metas' } },
        { path: 'macrotemas/novo', component: ListMetas, props: { type: 'novo', group: 'macrotemas', parentPage: 'metas' } },
        { path: 'subtemas/novo', component: ListMetas, props: { type: 'novo', group: 'subtemas', parentPage: 'metas' } },
        { path: 'temas/novo', component: ListMetas, props: { type: 'novo', group: 'temas', parentPage: 'metas' } },
        { path: 'tags/novo', component: ListMetas, props: { type: 'novo', group: 'tags', parentPage: 'metas' } },
        { path: 'macrotemas/:id', component: ListMetasGroup, props: { type: 'list', group: 'macro_tema', parentPage: 'metas' } },
        { path: 'macrotemas/:macro_tema_id/novo', component: AddEditMetas, props: { type: 'novo', group: 'macro_tema', parentPage: 'metas' } },
        { path: 'subtemas/:id', component: ListMetasGroup, props: { type: 'list', group: 'sub_tema', parentPage: 'metas' } },
        { path: 'subtemas/:sub_tema_id/novo', component: AddEditMetas, props: { type: 'novo', group: 'sub_tema', parentPage: 'metas' } },
        { path: 'temas/:id', component: ListMetasGroup, props: { type: 'list', group: 'tema', parentPage: 'metas' } },
        { path: 'temas/:tema_id/novo', component: AddEditMetas, props: { type: 'novo', group: 'tema', parentPage: 'metas' } },
        { path: 'tags/:id', component: ListMetasGroup, props: { type: 'list', group: 'tags', parentPage: 'metas' } },
        { path: ':meta_id', component: SingleMeta, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/indicadores/novo', component: AddEditIndicador, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/indicadores/:indicador_id', component: AddEditIndicador, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/indicadores/:indicador_id/variaveis/novo', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':meta_id/indicadores/:indicador_id/variaveis/novo/:copy_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id/valores', component: AddEditIndicador, props: { group: 'valores', submenu: SubmenuMetas } },
        { path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id/retroativos', component: AddEditIndicador, props: { group: 'retroativos', submenu: SubmenuMetas } },
        { path: ':meta_id/painel', component: SinglePainelMeta, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/evolucao', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/evolucao/:indicador_id', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/evolucao/:indicador_id/variaveis/novo', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':meta_id/evolucao/:indicador_id/variaveis/novo/:copy_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':meta_id/evolucao/:indicador_id/variaveis/:var_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':meta_id/evolucao/:indicador_id/variaveis/:var_id/valores', component: SingleEvolucao, props: { group: 'valores', submenu: SubmenuMetas } },
        { path: ':meta_id/evolucao/:indicador_id/variaveis/:var_id/retroativos', component: SingleEvolucao, props: { group: 'retroativos', submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma', component: SingleCronograma, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/novo', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id/etapas/novo', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/novo', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id/monitorar/iniciativa', component: SingleCronograma, props: { group: 'monitorar', recorte: 'iniciativa', submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id/monitorar/atividade', component: SingleCronograma, props: { group: 'monitorar', recorte: 'atividade', submenu: SubmenuMetas } },
        { path: ':meta_id/cronograma/:cronograma_id/monitorar/:etapa_id', component: SingleCronograma, props: { group: 'monitorar', submenu: SubmenuMetas } },

        {
          path: ':meta_id/orcamento',
          redirect: (to) => `${to.path}/custo`,
        },

        { path: ':meta_id/orcamento/custo', component: MetaOrcamento, props: { submenu: SubmenuMetas, area: 'Custo', title: 'Previsão de Custo' } },
        { path: ':meta_id/orcamento/custo/:ano', component: AddEditCusteio, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/orcamento/custo/:ano/:id', component: AddEditCusteio, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/orcamento/planejado', component: MetaOrcamento, props: { submenu: SubmenuMetas, area: 'Planejado', title: 'Orçamento Planejado' } },
        { path: ':meta_id/orcamento/planejado/:ano', component: AddEditPlanejado, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/orcamento/planejado/:ano/:id', component: AddEditPlanejado, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/orcamento/realizado', component: MetaOrcamento, props: { submenu: SubmenuMetas, area: 'Realizado', title: 'Orçamento Realizado' } },
        { path: ':meta_id/orcamento/realizado/:ano/dotacao', component: AddRealizado, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/orcamento/realizado/:ano/processo', component: AddRealizadoProcesso, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/orcamento/realizado/:ano/nota', component: AddRealizadoNota, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/orcamento/realizado/:ano/:id', component: EditRealizado, props: { submenu: SubmenuMetas } },
        { path: ':meta_id/orcamento/realizado/:ano/dotacao/:id', component: EditRealizado, props: { submenu: SubmenuMetas } },

        {
          path: ':meta_id/iniciativas',
          children: [
            { path: '', component: SingleMeta, props: { submenu: SubmenuMetas } },
            { path: 'novo', component: AddEditIniciativa, props: { submenu: SubmenuMetas } },
            { path: 'editar/:iniciativa_id', component: AddEditIniciativa, props: { submenu: SubmenuMetas } },
            { path: ':iniciativa_id', component: SingleIniciativa, props: { submenu: SubmenuMetas } },
            { path: ':iniciativa_id/indicadores/novo', component: AddEditIndicador, props: { submenu: SubmenuMetas } },
            { path: ':iniciativa_id/indicadores/:indicador_id', component: AddEditIndicador, props: { submenu: SubmenuMetas } },
            { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/novo', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/novo/:copy_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id/valores', component: AddEditIndicador, props: { group: 'valores', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id/retroativos', component: AddEditIndicador, props: { group: 'retroativos', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/evolucao', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
            { path: ':iniciativa_id/evolucao/:indicador_id', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
            { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/novo', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/novo/:copy_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/:var_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/:var_id/valores', component: SingleEvolucao, props: { group: 'valores', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/:var_id/retroativos', component: SingleEvolucao, props: { group: 'retroativos', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma', component: SingleCronograma, props: { submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/novo', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/:cronograma_id', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/novo', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/novo', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/:cronograma_id/monitorar/atividade', component: SingleCronograma, props: { group: 'monitorar', recorte: 'atividade', submenu: SubmenuMetas } },
            { path: ':iniciativa_id/cronograma/:cronograma_id/monitorar/:etapa_id', component: SingleCronograma, props: { group: 'monitorar', submenu: SubmenuMetas } },
            {
              path: ':iniciativa_id/atividades',
              children: [
                { path: '', component: SingleIniciativa, props: { submenu: SubmenuMetas } },
                { path: 'novo', component: AddEditAtividade, props: { submenu: SubmenuMetas } },
                { path: 'editar/:atividade_id', component: AddEditAtividade, props: { submenu: SubmenuMetas } },
                { path: ':atividade_id', component: SingleAtividade, props: { submenu: SubmenuMetas } },
                { path: ':atividade_id/indicadores/novo', component: AddEditIndicador, props: { submenu: SubmenuMetas } },
                { path: ':atividade_id/indicadores/:indicador_id', component: AddEditIndicador, props: { submenu: SubmenuMetas } },
                { path: ':atividade_id/indicadores/:indicador_id/variaveis/novo', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
                { path: ':atividade_id/indicadores/:indicador_id/variaveis/novo/:copy_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
                { path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
                { path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id/valores', component: AddEditIndicador, props: { group: 'valores', submenu: SubmenuMetas } },
                { path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id/retroativos', component: AddEditIndicador, props: { group: 'retroativos', submenu: SubmenuMetas } },
                { path: ':atividade_id/evolucao', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
                { path: ':atividade_id/evolucao/:indicador_id', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
                { path: ':atividade_id/evolucao/:indicador_id/variaveis/novo', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
                { path: ':atividade_id/evolucao/:indicador_id/variaveis/novo/:copy_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
                { path: ':atividade_id/evolucao/:indicador_id/variaveis/:var_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
                { path: ':atividade_id/evolucao/:indicador_id/variaveis/:var_id/valores', component: SingleEvolucao, props: { group: 'valores', submenu: SubmenuMetas } },
                { path: ':atividade_id/evolucao/:indicador_id/variaveis/:var_id/retroativos', component: SingleEvolucao, props: { group: 'retroativos', submenu: SubmenuMetas } },
                { path: ':atividade_id/cronograma', component: SingleCronograma, props: { submenu: SubmenuMetas } },
                { path: ':atividade_id/cronograma/novo', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
                { path: ':atividade_id/cronograma/:cronograma_id', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
                { path: ':atividade_id/cronograma/:cronograma_id/etapas/novo', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
                { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
                { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/novo', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
                { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
                { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
                { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
              ],
            },
          ],
        },

      ],
    },
    relatorios,

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach(async (r) => {
  const publicPages = ['/login', '/esqueci-minha-senha', '/nova-senha'];
  const authRequired = !publicPages.includes(r.path);
  const authStore = useAuthStore();

  if (authRequired && !authStore.user) {
    authStore.returnUrl = r.fullPath;
    return '/login';
  }
  if (r.path == '/nova-senha' && !authStore.reducedtoken) {
    return '/login';
  }
});
