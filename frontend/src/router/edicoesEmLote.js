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
        rotasParaMigalhasDePão: [
          'edicoesEmLoteRaiz',
        ],
      },
      children: [
        {
          name: 'edicoesEmLoteObras',
          path: '',
          component: EdicoesEmLoteLista,
          meta: {
            título: 'Lista de edições de obras em lote',
          },
        },
        {
          path: ':edicaoEmLoteId',
          name: 'edicoesEmLoteObrasResumo',
          component: EdicoesEmLoteResumo,
          props: tiparPropsDeRota,
          meta: {
            rotaDeEscape: 'edicoesEmLoteObras',
            títuloParaMenu: undefined,
            título: 'Resumo de edição de obras em lote',
            rotasParaMigalhasDePão: [
              'edicoesEmLoteRaiz',
              'edicoesEmLoteObras',
            ],
          },
        },
        {
          path: 'novo',
          component: () => import('@/views/edicoesEmLote/obras/EdicoesEmLoteObrasRaiz.vue'),
          meta: {
            títuloParaMenu: undefined,
          },
          children: [
            {
              path: '',
              name: 'edicoesEmLoteObrasNovo',
              component: () => import('@/views/edicoesEmLote/obras/EdicoesEmLoteObrasSelecionar.vue'),
              meta: {
                rotaDeEscape: 'edicoesEmLoteObras',
                título: 'Selecionar nova edição de obras em lote',
                rotasParaMigalhasDePão: [
                  'edicoesEmLoteRaiz',
                  'edicoesEmLoteObras',
                ],
              },
            },
            {
              path: 'construir',
              name: 'edicoesEmLoteObrasNovoConstruir',
              component: () => import('@/views/edicoesEmLote/obras/EdicoesEmLoteObrasConstruir.vue'),
              meta: {
                rotaDeEscape: 'edicoesEmLoteObras',
                título: 'Construir nova edição de obras em lote',
                rotasParaMigalhasDePão: [
                  'edicoesEmLoteObras',
                  'edicoesEmLoteObrasNovo',
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};
