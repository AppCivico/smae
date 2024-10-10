import qs from 'qs';
import { watch } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import $eventHub from '@/components/eventHub';

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
import graficos from './graficos';
import metas from './metas';
import monitoramento from './monitoramento';
import obras from './obras';
import panoramaTransferencias from './panoramaTransferencias';
import parlamentares from './parlamentares';
import planosSetoriais from './planosSetoriais';
import projetos from './projetos';
import relatorios from './relatorios';
import painelEstratégico from './painelEstrategico';
import transferenciasVoluntarias from './transferenciasVoluntarias';
import variaveis from './variaveis';
import comunicadosGerais from './comunicadosGerais';
import oportunidades from './ps.oportunidades';
import retornarModuloDeEntidadeMae from '@/helpers/retornarModuloDeEntidadeMae';

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
      meta: {
        entidadeMãe: '',
      },
    },
    {
      path: '/panorama',
      name: 'panorama',
      component: Panorama,
      props: { submenu: false },
      meta: {
        entidadeMãe: 'pdm',
      },
    },

    { path: '/login', component: Login },
    { path: '/esqueci-minha-senha', component: LostPassword },
    { path: '/nova-senha', component: NewPassword },

    ...administracao,
    ...configuracoes,

    monitoramento,
    metas,
    parlamentares,
    planosSetoriais,
    projetos,
    análise,
    obras,
    graficos,
    relatorios,
    painelEstratégico,
    envios,
    transferenciasVoluntarias,
    comunicadosGerais,
    oportunidades,
    panoramaTransferencias,
    variaveis,

    {
      path: '/lista-de-icones',
      component: () => import('@/views/ListaDeIcones.vue'),
      meta: {
        título: 'Lista de ícones',
      },
    },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  parseQuery(query) {
    return qs.parse(query);
  },
  stringifyQuery(query) {
    return qs.stringify(query) || '';
  },
});

router.beforeEach(async (r, from) => {
  const publicPages = ['/login', '/esqueci-minha-senha', '/nova-senha'];
  const authRequired = !publicPages.includes(r.path);
  const authStore = useAuthStore();

  if (from.meta?.entidadeMãe !== undefined) {
    authStore.moduloDaRotaAnterior = retornarModuloDeEntidadeMae(from.meta.entidadeMãe);
  }

  if (authRequired && !authStore.user) {
    authStore.returnUrl = r.fullPath;
    return '/login';
  }
  if (r.path === '/nova-senha' && !authStore.reducedtoken) {
    return '/login';
  }
});

router.afterEach((to, from) => {
  const { título, classeRaiz } = to.meta;
  const { classeRaiz: classeRaizAnterior } = from.meta;

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

  if (classeRaizAnterior !== classeRaiz) {
    if (classeRaizAnterior) {
      document.documentElement.classList.remove(classeRaizAnterior);
    }

    if (classeRaiz) {
      document.documentElement.classList.add(classeRaiz);
    }
  }
});

router.beforeEach((to, from, next) => {
  const { meta } = to;

  // if (Object.keys(to.meta.defaultQuery).length && to.name !== from.name) {
  //   next({
  //     query: {
  //       ...to.meta.defaultQuery,
  //       ...to.query,
  //     },
  //   });

  //   return;
  // }

  if (typeof to.matched.find((rota) => rota.name !== undefined)?.components?.default === 'function') {
    $eventHub.emit('recebimentoIniciado', to); // Start progress bar
  }

  Object.keys(meta).forEach((key) => {
    // Limitar à propriedade `prefixoDosCaminhos` para manter a
    // retrocompatibilidade com a propriedade `título`,
    // que precisa ser usada numa `computed()`
    if (typeof meta[key] === 'function' && key === 'prefixoDosCaminhos') {
      meta[key] = meta[key](to);
    }
  });

  next();
});

router.beforeResolve((to, from, next) => {
  $eventHub.emit('recebimentoEncerrado'); // Stop progress bar
  next();
});
