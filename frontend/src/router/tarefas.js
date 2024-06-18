import EmailModal from '@/components/EmailModal.vue';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import DialogWrapper from '@/views/DialogWrapper.vue';
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
    prefixoParaFilhas: 'projeto',
  },
  children: [
    {
      name: 'projetoTarefasListar',
      path: '',
      component: TarefasLista,
      meta: {
        título: 'Cronograma de projeto',
        títuloParaMenu: 'Cronograma',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'projetoTarefasListar',
        ],
      },
      props: true,

      children: [
        {
          path: 'disparo-email',
          component: DialogWrapper,
          meta: {
            rotaDeEscape: 'projetoTarefasListar',
            título: 'Novo disparo de e-mail para cronograma',
            títuloParaMenu: 'Novo e-mail',
          },
          children: [
            {
              path: '',
              name: 'EmailModal',
              component: EmailModal,
            },
          ],
        },

        {
          name: 'projetoTarefasClonar',
          path: 'clonar',
          component: () => import('@/views/tarefas/TarefasClonar.vue'),
          meta: {
            título: 'Clonar tarefas',
            títuloParaMenu: 'Clonar tarefas',
            rotaDeEscape: 'projetoTarefasListar',
          },
        },
      ],
    },

    {
      name: 'projetoTarefasCriar',
      path: 'nova',
      component: TarefasCriarEditar,
      meta: {
        título: 'Nova tarefa',
        títuloParaMenu: 'Nova tarefa',
        rotaDeEscape: 'projetoTarefasListar',
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
          name: 'projetoTarefasEditar',
          component: TarefasCriarEditar,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            tarefaId: Number.parseInt(params.tarefaId, 10) || undefined,
          }),

          meta: {
            título: () => useTarefasStore()?.emFoco?.tarefa || 'Editar tarefa',
            títuloParaMenu: 'Editar tarefa',

            rotaDeEscape: 'projetoTarefasListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'projetoTarefasListar',
              'projetoTarefasEditar',
            ],
          },
        },

        {
          path: 'progresso',
          name: 'projetoTarefasProgresso',
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

            rotaDeEscape: 'projetoTarefasListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'projetoTarefasListar',
              'projetoTarefasProgresso',
            ],
          },
        },
      ],
    },
  ],
};
