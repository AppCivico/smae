import dateToField from '@/helpers/dateToField';
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';
import AcompanhamentosCriarEditar from '@/views/acompanhamentos/AcompanhamentosCriarEditar.vue';
import AcompanhamentosItem from '@/views/acompanhamentos/AcompanhamentosItem.vue';
import AcompanhamentosLista from '@/views/acompanhamentos/AcompanhamentosLista.vue';
import AcompanhamentosRaiz from '@/views/acompanhamentos/AcompanhamentosRaiz.vue';

export default {
  path: 'acompanhamentos',
  component: AcompanhamentosRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),

  meta: {
    requerAutenticação: true,

  },
  children: [
    {
      name: 'acompanhamentosListar',
      path: '',
      component: AcompanhamentosLista,
      meta: {
        título: 'Acompanhamento de projeto',
        títuloParaMenu: 'Acompanhamento do projeto',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'acompanhamentosListar',
        ],
      },
      props: true,
    },

    {
      name: 'acompanhamentosCriar',
      path: 'novo',
      component: AcompanhamentosCriarEditar,
      meta: {
        título: 'Novo registro de acompanhamento',
        títuloParaMenu: 'Novo registro de acompanhamento',

        rotaDeEscape: 'acompanhamentosListar',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'acompanhamentosListar',
          'acompanhamentosCriar',
        ],
      },
    },

    {
      path: ':acompanhamentoId',
      component: AcompanhamentosItem,
      props: ({ params }) => ({
        ...params,
        projetoId: Number.parseInt(params.projetoId, 10) || undefined,
        acompanhamentoId: Number.parseInt(params.acompanhamentoId, 10) || undefined,
      }),

      children: [
        {
          path: '',
          name: 'acompanhamentosEditar',
          component: AcompanhamentosCriarEditar,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            acompanhamentoId: Number.parseInt(params.acompanhamentoId, 10) || undefined,
          }),

          meta: {
            título: () => (useAcompanhamentosStore()?.emFoco?.data_registro
              ? `Em ${dateToField(useAcompanhamentosStore()?.emFoco?.data_registro)}`
              : 'Editar acompanhamento'),
            títuloParaMenu: 'Editar acompanhamento',

            rotaDeEscape: 'acompanhamentosListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'acompanhamentosListar',
              'acompanhamentosEditar',
            ],
          },
        },
      ],
    },
  ],
};
