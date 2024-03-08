import qs from 'qs';
import { watch } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

// Stores
import { useAuthStore } from '@/stores/auth.store';

// Views
import { Home } from '@/views';

import { Login, LostPassword, NewPassword } from '@/views/auth';

import ParlamentaresCriarEditar from '@/views/parlamentares/ParlamentaresCriarEditar.vue';
import ParlamentaresLista from '@/views/parlamentares/ParlamentaresLista.vue';
import ParlamentaresRaiz from '@/views/parlamentares/ParlamentaresRaiz.vue';
import ParlamentarDetalhe from '@/views/parlamentares/ParlamentarDetalhe.vue';

import Panorama from '@/views/Panorama.vue';
import administracao from './administracao';
import análise from './analise';
import configuracoes from './configuracoes';
import envios from './envios';
import metas from './metas';
import monitoramento from './monitoramento';
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

    {
      path: '/parlamentares',
      component: ParlamentaresRaiz,
      meta: {
        title: 'Parlamentares',
        rotaPrescindeDeChave: true,
      },
      children: [
        {
          name: 'parlamentaresListar',
          path: '',
          component: ParlamentaresLista,
          meta: {
            título: 'Lista de Parlamentares',
          },
        },
        {
          name: 'parlamentaresCriar',
          path: 'novo',
          component: ParlamentaresCriarEditar,
          meta: {
            título: 'Registro de parlamentar',
          },
        },
        {
          path: 'editar/:parlamentarId',
          name: 'parlamentaresEditar',
          component: ParlamentaresCriarEditar,
          props: ({ params }) => ({
            ...params,
            ...{ parlamentarId: Number.parseInt(params.parlamentarId, 10) || undefined },
          }),

          meta: {
            título: 'Editar parlamentar',
          },

          children: [
            {
              path: 'equipe/:pessoaId?',
              name: 'parlamentaresEditarEquipe',
              component: () => import('@/views/parlamentares/ParlamentarEquipe.vue'),
              props: true,
              meta: {
                título: 'Integrante de equipe',
                rotaDeEscape: 'parlamentaresEditar',
              },
            },
            {
              path: 'mandato/:mandatoId?',
              name: 'parlamentaresEditarMandato',
              component: () => import('@/views/parlamentares/ParlamentarMandato.vue'),
              props: true,
              meta: {
                título: 'Mandato legislativo',
                rotaDeEscape: 'parlamentaresEditar',
              },
            },
          ],
        },
        {
          path: ':parlamentarId',
          name: 'parlamentarDetalhe',
          component: ParlamentarDetalhe,
          props: ({ params }) => ({
            ...params,
            ...{ parlamentarId: Number.parseInt(params.parlamentarId, 10) || undefined },
          }),

          meta: {
            título: 'Carometro',
          },
        },
      ],
    },

    { path: '/login', component: Login },
    { path: '/esqueci-minha-senha', component: LostPassword },
    { path: '/nova-senha', component: NewPassword },

    ...administracao,
    ...configuracoes,

    monitoramento,
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
