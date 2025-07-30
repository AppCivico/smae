import { useRoute } from 'vue-router';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import PlanosDeAçãoCriarEditar from '@/views/planosDeAcao/PlanosDeAcaoCriarEditar.vue';
import PlanosDeAçãoItem from '@/views/planosDeAcao/PlanosDeAcaoItem.vue';
import PlanosDeAçãoLista from '@/views/planosDeAcao/PlanosDeAcaoLista.vue';
import PlanosDeAçãoMonitoramento from '@/views/planosDeAcao/PlanosDeAcaoMonitoramento.vue';
import PlanosDeAçãoRaiz from '@/views/planosDeAcao/PlanosDeAcaoRaiz.vue';
import PlanosDeAçãoDetalhes from '@/views/planosDeAcao/PlanosDeAcaoDetalhe.vue';
import { usePlanosDeAçãoStore } from '@/stores/planosDeAcao.store';

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
        tituloParaMigalhaDePao: () => {
          const { name: nomeRotaAtual } = useRoute();
          const { emFoco } = useRiscosStore();

          if (!emFoco) {
            return 'Resumo de riscos';
          }

          if (nomeRotaAtual === 'planosDeAçãoListar') {
            return `Resumo: Risco ${emFoco.titulo}`;
          }

          return `Risco ${emFoco.titulo}`;
        },
        título: 'Resumo de risco',
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
            tituloParaMigalhaDePao: 'Editar',
            rotaDeEscape: 'planosDeAçãoListar',
            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'riscosListar',
              'planosDeAçãoListar',
              'detalhes',
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
            tituloParaMigalhaDePao: 'Novo Monitoramento',
            rotaDeEscape: 'planosDeAçãoListar',
            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'riscosListar',
              'planosDeAçãoListar',
              'detalhes',
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
            tituloParaMigalhaDePao: () => {
              const { name: nomeRotaAtual } = useRoute();
              const { emFoco } = usePlanosDeAçãoStore();

              if (!emFoco) {
                return 'Resumo plano de ação';
              }

              if (nomeRotaAtual === 'detalhes') {
                return `Resumo: ${emFoco.contramedida}`;
              }

              return `${emFoco.contramedida}`;
            },
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
