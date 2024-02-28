// Stores
import { useAuthStore } from '@/stores/auth.store';

import { default as SubmenuMonitoramento } from '@/components/SubmenuMonitoramento.vue';
import {
  ListCiclos,
  ListCiclosPassados,
  ListMonitoramentoMetas,
  ListMonitoramentoMetasCronograma,
  ListMonitoramentoMetasEvolucao,
  MonitoramentoMetas,
  MonitoramentoMetasCronograma,
} from '@/views/monitoramento';

import MonitoramentosRaiz from '@/views/monitoramento/MonitoramentosRaiz.vue';
import MonitoramentosVariáveis from '@/views/monitoramento/MonitoramentoPorVariaveis.vue';
import MonitoramentosTarefas from '@/views/monitoramento/MonitoramentoPorTarefas.vue';

export default {
  path: '/monitoramento',
  meta: {
    rotaPrescindeDeChave: false,
  },
  children: [
    {
      path: '',
      component: MonitoramentosRaiz,
      props: { submenu: SubmenuMonitoramento, parentPage: 'fases' },

      redirect: () => (useAuthStore()?.user?.flags?.mf_v2
        ? { name: 'monitoramentoPorVariáveis' }
        : { name: 'monitoramentoDeEvoluçãoDeMetas' }),

      children: [
        {
          path: 'variaveis',
          name: 'monitoramentoPorVariáveis',
          component: MonitoramentosVariáveis,
          meta: {
            rotaPrescindeDeChave: true,
          },
        },
        {
          path: 'tarefas',
          name: 'monitoramentoPorTarefas',
          component: MonitoramentosTarefas,
          meta: {
            rotaPrescindeDeChave: true,
          },
        },
      ],
    },
    { path: 'fases', component: ListMonitoramentoMetas, props: { submenu: SubmenuMonitoramento, parentPage: 'fases' } },
    {
      name: 'monitoramentoDeEvoluçãoDeMetas',
      path: 'evolucao',
      component: ListMonitoramentoMetasEvolucao,
      props: { submenu: SubmenuMonitoramento, parentPage: 'evolucao' },
    },
    {
      name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
      path: 'evolucao/:meta_id',
      component: MonitoramentoMetas,
      props: { submenu: SubmenuMonitoramento, parentPage: 'evolucao' },
    },
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
};
