import { useRiscosStore } from '@/stores/riscos.store.ts';
import PlanosDeAçãoCriarEditar from '@/views/planosDeAcao/PlanosDeAcaoCriarEditar.vue';
import PlanosDeAçãoItem from '@/views/planosDeAcao/PlanosDeAcaoItem.vue';
import PlanosDeAçãoLista from '@/views/planosDeAcao/PlanosDeAcaoLista.vue';
import PlanosDeAçãoMonitoramento from '@/views/planosDeAcao/PlanosDeAcaoMonitoramento.vue';
import PlanosDeAçãoRaiz from '@/views/planosDeAcao/PlanosDeAcaoRaiz.vue';
import PlanosDeAçãoDetalhes from '@/views/planosDeAcao/PlanosDeAcaoDetalhe.vue';

export default {
  path: 'planos-de-acao',
  component: PlanosDeAçãoRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),

  meta: {
    títuloParaMenu: 'Planos de ação',
    título: 'Planos de ação',
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
        título: () => {
          if (useRiscosStore()?.emFoco) {
            const { codigo, titulo } = useRiscosStore().emFoco;
            return `${codigo} - ${titulo}`;
          }
          return 'Resumo de risco';
        },
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'riscosListar',
        ],
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
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'riscosListar',
          'planosDeAçãoListar',
          'planosDeAçãoCriar',
        ],
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
            título: 'Editar plano de ação',
            títuloParaMenu: 'Editar plano de ação',

            rotaDeEscape: 'planosDeAçãoListar',
            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'riscosListar',
              'planosDeAçãoListar',
              'planosDeAçãoEditar',
            ],
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
            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'riscosListar',
              'planosDeAçãoListar',
              'planosDeAçãoEditar',
              'planosDeAçãoMonitoramento',
            ],
          },
        },

        {
          path: 'detalhes',
          name: 'detalhes',
          component: PlanosDeAçãoDetalhes,
          props: ({ params }) => ({
            ...params,
            planoId: Number.parseInt(params.planoId, 10) || undefined,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
          }),
          meta: {
            título: 'Resumo do Plano de ação',
            títuloParaMenu: 'Resumo',
            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'riscosListar',
              'planosDeAçãoListar',
            ],
          },
        },

      ],
    },
  ],
};
