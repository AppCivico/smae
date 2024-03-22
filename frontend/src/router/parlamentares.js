import ParlamentarDetalhe from '@/views/parlamentares/ParlamentarDetalhe.vue';
import ParlamentaresCriarEditar from '@/views/parlamentares/ParlamentaresCriarEditar.vue';
import ParlamentaresLista from '@/views/parlamentares/ParlamentaresLista.vue';
import ParlamentaresRaiz from '@/views/parlamentares/ParlamentaresRaiz.vue';

export default {
  path: '/parlamentares',
  component: ParlamentaresRaiz,
  meta: {
    título: 'Parlamentares',
    rotaPrescindeDeChave: true,
    limitarÀsPermissões: 'CadastroParlamentar.',
  },
  children: [
    {
      name: 'parlamentaresListar',
      path: '',
      component: ParlamentaresLista,
      meta: {
        título: 'Lista de Parlamentares',
        títuloParaMenu: 'Parlamentares',
      },
    },
    {
      name: 'parlamentaresCriar',
      path: 'novo',
      component: ParlamentaresCriarEditar,
      meta: {
        título: 'Registro de parlamentar',
      },
    },
    {
      path: 'editar/:parlamentarId',
      name: 'parlamentaresEditar',
      component: ParlamentaresCriarEditar,
      props: ({ params }) => ({
        ...params,
        ...{ parlamentarId: Number.parseInt(params.parlamentarId, 10) || undefined },
      }),

      meta: {
        título: 'Editar parlamentar',
        rotasParaMigalhasDePão: [
          'parlamentaresListar',
          'parlamentarDetalhe',
        ],
      },

      children: [
        {
          path: 'equipe/:pessoaId?',
          name: 'parlamentaresEditarEquipe',
          component: () => import('@/views/parlamentares/ParlamentarEquipe.vue'),
          props: ({ params, query }) => ({
            ...params,
            ...query,
          }),
          meta: {
            rotaDeEscape: 'parlamentaresEditar',
          },
        },
        {
          path: 'mandato/:mandatoId?',
          name: 'parlamentaresEditarMandato',
          component: () => import('@/views/parlamentares/ParlamentarMandato.vue'),
          props: true,
          meta: {
            rotaDeEscape: 'parlamentaresEditar',
          },
        },
        {
          path: 'representatividade/:representatividadeId?',
          name: 'parlamentaresEditarRepresentatividade',
          component: () => import('@/views/parlamentares/ParlamentarRepresentatividade.vue'),
          props: ({ params, query }) => ({
            ...params,
            ...query,
          }),
          meta: {
            rotaDeEscape: 'parlamentaresEditar',
          },
        },
      ],
    },
    {
      path: ':parlamentarId',
      name: 'parlamentarDetalhe',
      component: ParlamentarDetalhe,
      props: ({ params }) => ({
        ...params,
        ...{ parlamentarId: Number.parseInt(params.parlamentarId, 10) || undefined },
      }),

      meta: {
        título: 'Carometro',
        rotasParaMigalhasDePão: [
          'parlamentaresListar',
        ],
      },
    },
  ],
};
