import { defineAsyncComponent } from 'vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import formatProcesso from '@/helpers/formatProcesso';
import { useProcessosStore } from '@/stores/processos.store.ts';
import ProcessosCriarEditar from '@/views/processos/ProcessosCriarEditar.vue';
import ProcessosItem from '@/views/processos/ProcessosItem.vue';
import ProcessosLista from '@/views/processos/ProcessosLista.vue';
import ProcessosRaiz from '@/views/processos/ProcessosRaiz.vue';

const processosResumo = defineAsyncComponent({
  loader: () => import('@/views/processos/ProcessosResumo.vue'),
  loadingComponent: LoadingComponent,
});

export default {
  path: 'processos',
  component: ProcessosRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),

  meta: {
  },
  children: [
    {
      name: 'processosListar',
      path: '',
      component: ProcessosLista,
      meta: {
        título: 'Processos SEI',
        títuloParaMenu: 'Processos SEI',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
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
            título: () => {
              const daApi = useProcessosStore()?.emFoco?.processo_sei;

              return daApi ? `Editar processo SEI ${formatProcesso(daApi)}` : 'Editar processo';
            },
            títuloParaMenu: 'Editar processo',

            rotaDeEscape: 'processosListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'processosListar',
            ],
          },
        },

        {
          path: 'resumo',
          name: 'processosResumo',
          component: processosResumo,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            processoId: Number.parseInt(params.processoId, 10) || undefined,
          }),
          meta: {
            título: () => {
              const daApi = useProcessosStore()?.emFoco?.processo_sei;

              return daApi ? `Resumo do processo SEI ${formatProcesso(daApi)}` : 'Resumo de processo';
            },
            títuloParaMenu: 'Resumo',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'processosListar',
            ],
          },
        },

      ],
    },
  ],
};
