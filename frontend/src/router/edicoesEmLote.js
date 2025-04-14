import tiparPropsDeRota from './helpers/tiparPropsDeRota';

const EdicoesEmLoteLista = () => import('@/views/edicoesEmLote/EdicoesEmLoteLista.vue');
const EdicoesEmLoteResumo = () => import('@/views/edicoesEmLote/EdicoesEmLoteResumo.vue');

export default {
  path: '/edicoes-em-lote',
  name: 'edicoesEmLoteRaiz',
  component: () => import('@/views/edicoesEmLote/EdicoesEmLoteRaiz.vue'),
  meta: {
    rotaPrescindeDeChave: true,
    título: 'Edições em lote',
    limitarÀsPermissões: [
      'Menu.AtualizacaoEmLote.MDO',
    ],
    rotasParaMenuSecundário: [
      'edicoesEmLoteObras',
    ],
  },
  children: [
    {
      path: 'obras',
      meta: {
        título: 'Edições de obras em lote',
        títuloParaMenu: 'Obras',
        rotaDeAdição: {
          name: 'edicoesEmLoteObrasNovo',
        },
        entidadeMãe: 'obras',
        limitarÀsPermissões: [
          'Menu.AtualizacaoEmLote.MDO',
        ],
        tipoDeAcoesEmLote: 'ProjetoMDO',
      },
      children: [
        {
          name: 'edicoesEmLoteObras',
          path: '',
          component: EdicoesEmLoteLista,
        },
        {
          path: ':edicaoEmLoteId',
          name: 'edicoesEmLoteObrasResumo',
          component: EdicoesEmLoteResumo,
          props: tiparPropsDeRota,
          meta: {
            rotaDeEscape: 'edicoesEmLoteObras',
          },
        },
        {
          path: 'novo',
          component: () => import('@/views/edicoesEmLote/obras/EdicoesEmLoteObrasRaiz.vue'),
          children: [
            {
              path: '',
              name: 'edicoesEmLoteObrasNovo',
              component: () => import('@/views/edicoesEmLote/obras/EdicoesEmLoteObrasSelecionar.vue'),
              meta: {
                rotaDeEscape: 'edicoesEmLoteObras',
              },
            },
            {
              path: 'construir',
              name: 'edicoesEmLoteObrasNovoConstruir',
              component: () => import('@/views/edicoesEmLote/obras/EdicoesEmLoteObrasConstruir.vue'),
              meta: {
                rotaDeEscape: 'edicoesEmLoteObras',
              },
            },
            {
              path: 'revisar',
              name: 'edicoesEmLoteObrasNovoRevisar',
              component: () => import('@/views/edicoesEmLote/obras/EdicoesEmLoteObrasRevisar.vue'),
              meta: {
                rotaDeEscape: 'edicoesEmLoteObrasNovo',
              },
            },
          ],
        },
      ],
    },
  ],
};
