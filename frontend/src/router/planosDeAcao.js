import { useRiscosStore } from '@/stores/riscos.store.ts';
import PlanosDeAçãoCriarEditar from '@/views/planosDeAcao/PlanosDeAcaoCriarEditar.vue';
import PlanosDeAçãoItem from '@/views/planosDeAcao/PlanosDeAcaoItem.vue';
import PlanosDeAçãoLista from '@/views/planosDeAcao/PlanosDeAcaoLista.vue';
import PlanosDeAçãoMonitoramento from '@/views/planosDeAcao/PlanosDeAcaoMonitoramento.vue';
import PlanosDeAçãoRaiz from '@/views/planosDeAcao/PlanosDeAcaoRaiz.vue';

export default {
  path: 'planos-de-acao',
  component: PlanosDeAçãoRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),

  meta: {
    requerAutenticação: true,

    títuloParaMenu: 'PlanosDeAção',
  },
  children: [
    {
      name: 'planosDeAçãoListar',
      path: '',
      component: PlanosDeAçãoLista,
      props: ({ params }) => ({
        ...params,
        projetoId: Number.parseInt(params.projetoId, 10) || undefined,
        riscoId: Number.parseInt(params.riscoId, 10) || undefined,
      }),
      meta: {
        título: () => useRiscosStore()?.emFoco?.consequencia || 'Resumo de risco',
      },
    },

    {
      name: 'planosDeAçãoCriar',
      path: 'novo',
      component: PlanosDeAçãoCriarEditar,
      meta: {
        título: 'Novo plano de ação',
        títuloParaMenu: 'Novo plano de ação',

        rotaDeEscape: 'planosDeAçãoListar',
      },
    },

    {
      path: ':planoId',
      component: PlanosDeAçãoItem,
      props: ({ params }) => ({
        ...params,
        planoId: Number.parseInt(params.planoId, 10) || undefined,
        projetoId: Number.parseInt(params.projetoId, 10) || undefined,
        riscoId: Number.parseInt(params.riscoId, 10) || undefined,
      }),

      children: [
        {
          path: '',
          name: 'planosDeAçãoEditar',
          component: PlanosDeAçãoCriarEditar,
          props: ({ params }) => ({
            ...params,
            planoId: Number.parseInt(params.planoId, 10) || undefined,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            riscoId: Number.parseInt(params.riscoId, 10) || undefined,
          }),

          meta: {
            título: 'Editar tarefa',
            títuloParaMenu: 'Editar tarefa',

            rotaDeEscape: 'planosDeAçãoListar',
          },
        },

        {
          path: 'monitoramento',
          name: 'planosDeAçãoMonitoramento',
          component: PlanosDeAçãoMonitoramento,
          props: ({ params }) => ({
            ...params,
            planoId: Number.parseInt(params.planoId, 10) || undefined,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            riscoId: Number.parseInt(params.riscoId, 10) || undefined,
          }),
          meta: {
            título: 'Monitoramento de plano de ação',
            títuloParaMenu: 'Monitoramento',

            rotaDeEscape: 'planosDeAçãoListar',
          },
        },
      ],
    },
  ],
};
