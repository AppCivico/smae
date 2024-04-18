import qs from 'qs';
import { watch } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

// Stores
import { useAuthStore } from '@/stores/auth.store';

// Views
import { Home } from '@/views';

import { Login, LostPassword, NewPassword } from '@/views/auth';

import Panorama from '@/views/Panorama.vue';
import administracao from './administracao';
import análise from './analise';
import configuracoes from './configuracoes';
import envios from './envios';
import metas from './metas';
import monitoramento from './monitoramento';
import parlamentares from './parlamentares';
import projetos from './projetos';
import relatorios from './relatorios';
import transferenciasVoluntarias from './transferenciasVoluntarias.js';
import atividades from './atividades';

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
    ...configuracoes,

    monitoramento,
    metas,
    parlamentares,
    projetos,
    análise,
    relatorios,
    envios,
    transferenciasVoluntarias,
    atividades,

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
