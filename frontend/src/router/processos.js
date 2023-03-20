import { useProcessosStore } from '@/stores/processos.store.ts';
import ProcessosCriarEditar from '@/views/processos/ProcessosCriarEditar.vue';
import ProcessosItem from '@/views/processos/ProcessosItem.vue';
import ProcessosLista from '@/views/processos/ProcessosLista.vue';
import ProcessosRaiz from '@/views/processos/ProcessosRaiz.vue';

export default {
  path: 'processos',
  component: ProcessosRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),

  meta: {
    requerAutenticação: true,

  },
  children: [
    {
      name: 'processosListar',
      path: '',
      component: ProcessosLista,
      meta: {
        título: 'Processos SEI do projeto',
        títuloParaMenu: 'Processos SEI',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'processosListar',
        ],
      },
      props: true,
    },

    {
      name: 'processosCriar',
      path: 'novo',
      component: ProcessosCriarEditar,
      meta: {
        título: 'Novo processo',
        títuloParaMenu: 'Novo processo',

        rotaDeEscape: 'processosListar',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'processosListar',
          'processosCriar',
        ],
      },
    },

    {
      path: ':processoId',
      component: ProcessosItem,
      props: ({ params }) => ({
        ...params,
        projetoId: Number.parseInt(params.projetoId, 10) || undefined,
        processoId: Number.parseInt(params.processoId, 10) || undefined,
      }),

      children: [
        {
          path: '',
          name: 'processosEditar',
          component: ProcessosCriarEditar,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            processoId: Number.parseInt(params.processoId, 10) || undefined,
          }),

          meta: {
            título: () => useProcessosStore()?.emFoco?.descricao || 'Editar processo',
            títuloParaMenu: 'Editar processo',

            rotaDeEscape: 'processosListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'processosListar',
              'processosEditar',
            ],
          },
        },
      ],
    },
  ],
};
