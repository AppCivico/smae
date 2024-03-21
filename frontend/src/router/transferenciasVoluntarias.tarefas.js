import { useTarefasStore } from '@/stores/tarefas.store.ts';
import TarefasCriarEditar from '@/views/tarefas/TarefasCriarEditar.vue';
import TarefasItem from '@/views/tarefas/TarefasItem.vue';
import TarefasLista from '@/views/tarefas/TarefasLista.vue';
import TarefasProgresso from '@/views/tarefas/TarefasProgresso.vue';
import TarefasRaiz from '@/views/tarefas/TarefasRaiz.vue';

export default {
  path: ':transferenciaId/tarefas',
  component: TarefasRaiz,

  props: true,

  meta: {
    títuloParaMenu: 'Tarefas',
  },
  children: [
    {
      name: 'TransferenciasVoluntariasTarefasListar',
      path: '',
      component: TarefasLista,
      meta: {
        título: 'Cronograma de transferência voluntária',
        títuloParaMenu: 'Cronograma',

        rotasParaMigalhasDePão: [
          'TransferenciasVoluntariasListar',
          'TransferenciasVoluntariasResumo',
          'TransferenciasVoluntariasTarefasListar',
        ],
      },
      props: true,
    },

    {
      name: 'transferenciaTarefasCriar',
      path: 'nova',
      component: TarefasCriarEditar,
      meta: {
        título: 'Nova tarefa',
        títuloParaMenu: 'Nova tarefa',
        rotaDeEscape: 'TransferenciasVoluntariasTarefasListar',
      },
    },

    {
      path: ':tarefaId',
      component: TarefasItem,
      props: true,

      children: [
        {
          path: '',
          name: 'tarefasEditar',
          component: TarefasCriarEditar,
          props: true,

          meta: {
            título: () => useTarefasStore()?.emFoco?.tarefa || 'Editar tarefa',
            títuloParaMenu: 'Editar tarefa',

            rotaDeEscape: 'TransferenciasVoluntariasTarefasListar',

            rotasParaMigalhasDePão: [
              'TransferenciasVoluntariasListar',
              'TransferenciasVoluntariasResumo',
              'TransferenciasVoluntariasTarefasListar',
              'tarefasEditar',
            ],
          },
        },

        {
          path: 'progresso',
          name: 'TransferenciasVoluntariasTarefasProgresso',
          component: TarefasProgresso,
          props: true,
          meta: {
            título: () => (useTarefasStore()?.emFoco?.tarefa
              ? `Registro de progresso de ${useTarefasStore().emFoco.tarefa}`
              : 'Registrar progresso'),
            títuloParaMenu: 'Progresso',

            rotaDeEscape: 'TransferenciasVoluntariasTarefasListar',

            rotasParaMigalhasDePão: [
              'TransferenciasVoluntariasListar',
              'TransferenciasVoluntariasResumo',
              'TransferenciasVoluntariasTarefasListar',
              'TransferenciasVoluntariasTarefasProgresso',
            ],
          },
        },
      ],
    },
  ],
};
