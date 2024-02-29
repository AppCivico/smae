import { useTarefasStore } from '@/stores/tarefas.store.ts';
import TarefasCriarEditar from '@/views/tarefas/TarefasCriarEditar.vue';
import TarefasItem from '@/views/tarefas/TarefasItem.vue';
import TarefasLista from '@/views/tarefas/TarefasLista.vue';
import TarefasProgresso from '@/views/tarefas/TarefasProgresso.vue';
import TarefasRaiz from '@/views/tarefas/TarefasRaiz.vue';

export default {
  path: 'tarefas',
  component: TarefasRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),

  meta: {
    títuloParaMenu: 'Tarefas',
  },
  children: [
    {
      name: 'tarefasListar',
      path: '',
      component: TarefasLista,
      meta: {
        título: 'Cronograma de projeto',
        títuloParaMenu: 'Cronograma',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'tarefasListar',
        ],
      },
      props: true,

      children: [
        {
          name: 'tarefasClonar',
          path: 'clonar',
          component: () => import('@/views/tarefas/TarefasClonar.vue'),
          meta: {
            título: 'Clonar tarefas',
            títuloParaMenu: 'Clonar tarefas',
            rotaDeEscape: 'tarefasListar',
          },
        },
      ],
    },

    {
      name: 'tarefasCriar',
      path: 'nova',
      component: TarefasCriarEditar,
      meta: {
        título: 'Nova tarefa',
        títuloParaMenu: 'Nova tarefa',
        rotaDeEscape: 'tarefasListar',
      },
    },

    {
      path: ':tarefaId',
      component: TarefasItem,
      props: ({ params }) => ({
        ...params,
        projetoId: Number.parseInt(params.projetoId, 10) || undefined,
        tarefaId: Number.parseInt(params.tarefaId, 10) || undefined,
      }),

      children: [
        {
          path: '',
          name: 'tarefasEditar',
          component: TarefasCriarEditar,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            tarefaId: Number.parseInt(params.tarefaId, 10) || undefined,
          }),

          meta: {
            título: () => useTarefasStore()?.emFoco?.tarefa || 'Editar tarefa',
            títuloParaMenu: 'Editar tarefa',

            rotaDeEscape: 'tarefasListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'tarefasListar',
              'tarefasEditar',
            ],
          },
        },

        {
          path: 'progresso',
          name: 'tarefasProgresso',
          component: TarefasProgresso,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            tarefaId: Number.parseInt(params.tarefaId, 10) || undefined,
          }),
          meta: {
            título: () => (useTarefasStore()?.emFoco?.tarefa
              ? `Registro de progresso de ${useTarefasStore().emFoco.tarefa}`
              : 'Registrar progresso'),
            títuloParaMenu: 'Progresso',

            rotaDeEscape: 'tarefasListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'tarefasListar',
              'tarefasProgresso',
            ],
          },
        },
      ],
    },
  ],
};
