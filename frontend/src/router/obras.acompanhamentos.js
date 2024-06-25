import dateToField from '@/helpers/dateToField';
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';
import AcompanhamentosCriarEditar from '@/views/mdo.acompanhamentos/AcompanhamentosCriarEditar.vue';

export default {
  path: 'acompanhamentos',
  component: () => import('@/views/mdo.acompanhamentos/AcompanhamentosRaiz.vue'),

  props: true,

  meta: {
    rotaPrescindeDeChave: true,
  },
  children: [
    {
      name: 'acompanhamentosDeObrasListar',
      path: '',
      component: () => import('@/views/mdo.acompanhamentos/AcompanhamentosLista.vue'),
      meta: {
        título: 'Acompanhamento da obra',
        títuloParaMenu: 'Acompanhamento da obra',

        rotasParaMigalhasDePão: [
          'obrasListar',
          // 'obrasResumo',
          'obrasEditar', // PRA-FAZER: trocar pela de resumo, quando estiver pronta
        ],
      },
      props: true,
    },

    {
      name: 'acompanhamentosDeObrasCriar',
      path: 'novo',
      component: AcompanhamentosCriarEditar,
      meta: {
        título: 'Novo registro de acompanhamento',
        títuloParaMenu: 'Novo registro de acompanhamento',

        rotaDeEscape: 'acompanhamentosDeObrasListar',

        rotasParaMigalhasDePão: [
          'obrasListar',
          // 'obrasResumo',
          'obrasEditar', // PRA-FAZER: trocar pela de resumo, quando estiver pronta
          'acompanhamentosDeObrasListar',
        ],
      },
    },

    {
      path: ':acompanhamentoId',
      component: () => import('@/views/mdo.acompanhamentos/AcompanhamentosItem.vue'),
      props: true,
      meta: {
        rotasParaMigalhasDePão: [
          'obrasListar',
          // 'obrasResumo',
          'obrasEditar', // PRA-FAZER: trocar pela de resumo, quando estiver pronta
          'acompanhamentosDeObrasListar',
        ],
      },

      children: [
        {
          path: '',
          name: 'acompanhamentosDeObrasEditar',
          component: AcompanhamentosCriarEditar,
          props: true,

          meta: {
            título: () => (useAcompanhamentosStore()?.emFoco?.data_registro
              ? `Em ${dateToField(useAcompanhamentosStore()?.emFoco?.data_registro)}`
              : 'Editar acompanhamento'),
            títuloParaMenu: 'Editar acompanhamento',
            rotaDeEscape: 'acompanhamentosDeObrasListar',
          },
        },

        {
          path: 'resumo',
          name: 'acompanhamentosDeObrasResumo',
          component: () => import('@/views/mdo.acompanhamentos/AcompanhamentosResumo.vue'),
          props: true,
          meta: {
            título: 'Resumo do acompanhamento',
            títuloParaMenu: 'Resumo',
          },
        },
      ],
    },
  ],
};
