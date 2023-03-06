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
    requerAutenticação: true,

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
            título: 'Editar tarefa',
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
            título: 'Registrar progresso',
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
