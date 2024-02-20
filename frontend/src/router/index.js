import qs from 'qs';
import { watch } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

// Stores
import { useAuthStore } from '@/stores/auth.store';

// Views
import { default as SubmenuMonitoramento } from '@/components/SubmenuMonitoramento.vue';
import { Home } from '@/views';

import { Login, LostPassword, NewPassword } from '@/views/auth';
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
import Panorama from '@/views/Panorama.vue';
import administracao from './administracao';
import análise from './analise';
import envios from './envios';
import metas from './metas';
import projetos from './projetos';
import relatorios from './relatorios';

// eslint-disable-next-line import/prefer-default-export
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: 'active',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      props: { submenu: false },
    },
    {
      path: '/panorama',
      name: 'panorama',
      component: Panorama,
      props: { submenu: false },
    },
    { path: '/login', component: Login },
    { path: '/esqueci-minha-senha', component: LostPassword },
    { path: '/nova-senha', component: NewPassword },

    ...administracao,

    {
      path: '/monitoramento',
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
    },

    metas,
    projetos,
    análise,
    relatorios,
    envios,

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  parseQuery(query) {
    return qs.parse(query);
  },
  stringifyQuery(query) {
    return qs.stringify(query) || '';
  },
});

router.beforeEach(async (r) => {
  const publicPages = ['/login', '/esqueci-minha-senha', '/nova-senha'];
  const authRequired = !publicPages.includes(r.path);
  const authStore = useAuthStore();

  if (authRequired && !authStore.user) {
    authStore.returnUrl = r.fullPath;
    return '/login';
  }
  if (r.path === '/nova-senha' && !authStore.reducedtoken) {
    return '/login';
  }
});

router.afterEach((to) => {
  const { título } = to.meta;

  if (título) {
    if (typeof título === 'function') {
      watch(() => título(), (novoValor) => {
        document.title = novoValor ? `${novoValor} | SMAE` : 'SMAE';
      }, { immediate: true });
    } else if (título) {
      document.title = `${título} | SMAE`;
    }
  } else if (document.title !== 'SMAE') {
    document.title = 'SMAE';
  }
});
