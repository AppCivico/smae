import { useRiscosStore } from '@/stores/riscos.store.ts';
import RiscosCriarEditar from '@/views/riscos/RiscosCriarEditar.vue';
import RiscosItem from '@/views/riscos/RiscosItem.vue';
import RiscosLista from '@/views/riscos/RiscosLista.vue';
import RiscosRaiz from '@/views/riscos/RiscosRaiz.vue';
import planosDeAção from './planosDeAcao';

export default {
  path: 'riscos',
  component: RiscosRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
    riscoId: Number.parseInt(params.riscoId, 10) || undefined,
  }),

  meta: {
    títuloParaMenu: 'Gestão de riscos',
  },
  children: [
    {
      name: 'riscosListar',
      path: '',
      component: RiscosLista,
      meta: {
        título: 'Gestão de riscos',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
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

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'riscosListar',
        ],
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
            título: () => {
              if (useRiscosStore()?.emFoco) {
                const { codigo, titulo } = useRiscosStore().emFoco;
                return `${codigo} - ${titulo}`;
              }

              return 'Editar risco';
            },
            títuloParaMenu: 'Editar risco',

            rotaDeEscape: 'riscosListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'riscosListar',
              'planosDeAçãoListar',
            ],
          },
        },

        planosDeAção,
      ],
    },
  ],
};
