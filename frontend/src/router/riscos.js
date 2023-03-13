import { useRiscosStore } from '@/stores/riscos.store.ts';
import RiscosCriarEditar from '@/views/riscos/RiscosCriarEditar.vue';
import RiscosItem from '@/views/riscos/RiscosItem.vue';
import RiscosLista from '@/views/riscos/RiscosLista.vue';
import RiscosRaiz from '@/views/riscos/RiscosRaiz.vue';
import RiscosResumo from '@/views/riscos/RiscosResumo.vue';
// import planosDeAção from './planosDeAcao';

export default {
  path: 'riscos',
  component: RiscosRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),

  meta: {
    requerAutenticação: true,

    títuloParaMenu: 'Riscos',
  },
  children: [
    {
      name: 'riscosListar',
      path: '',
      component: RiscosLista,
      meta: {
        título: 'Riscos sobre o projeto',
        títuloParaMenu: 'Riscos',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'riscosListar',
        ],
      },
      props: true,
    },

    {
      name: 'riscosCriar',
      path: 'novo',
      component: RiscosCriarEditar,
      meta: {
        título: 'Novo risco',
        títuloParaMenu: 'Novo risco',

        rotaDeEscape: 'riscosListar',
      },
    },

    {
      path: ':riscoId',
      component: RiscosItem,
      props: ({ params }) => ({
        ...params,
        projetoId: Number.parseInt(params.projetoId, 10) || undefined,
        riscoId: Number.parseInt(params.riscoId, 10) || undefined,
      }),

      children: [
        {
          path: '',
          name: 'riscosEditar',
          component: RiscosCriarEditar,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            riscoId: Number.parseInt(params.riscoId, 10) || undefined,
          }),

          meta: {
            título: () => useRiscosStore()?.emFoco?.consequencia || 'Editar risco',
            títuloParaMenu: 'Editar risco',

            rotaDeEscape: 'riscosListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'riscosListar',
              'riscosEditar',
            ],
          },
        },

        {
          path: 'resumo',
          name: 'riscosResumo',
          component: RiscosResumo,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            riscoId: Number.parseInt(params.riscoId, 10) || undefined,
          }),
          meta: {
            título: () => useRiscosStore()?.emFoco?.consequencia || 'Resumo de risco',
          },
        },

        // planosDeAção,
      ],
    },
  ],
};
