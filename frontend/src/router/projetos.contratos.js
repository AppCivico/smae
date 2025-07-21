import formatProcesso from '@/helpers/formatProcesso';
import { useProcessosStore } from '@/stores/processos.store.ts';
import ContratosCriarEditar from '@/views/mdo.contratos/ContratosCriarEditar.vue';

export default {
  path: 'contratos',
  component: () => import('@/views/mdo.contratos/ContratosRaiz.vue'),

  props: true,

  children: [
    {

      name: 'contratosDoProjetoListar',
      path: '',
      component: () => import('@/views/mdo.contratos/ContratosLista.vue'),
      meta: {
        título: 'Contratos',
        títuloParaMenu: 'Contratos',
      },
      props: true,
    },

    {
      name: 'contratosDoProjetoCriar',
      path: 'novo',
      component: ContratosCriarEditar,
      meta: {
        título: 'Novo contrato',
        títuloParaMenu: 'Novo contrato',

        rotaDeEscape: 'contratosDoProjetoListar',

        rotasParaMigalhasDePão: [
          'contratosDoProjetoListar',
        ],
      },
    },

    {
      path: ':contratoId',
      component: () => import('@/views/mdo.contratos/ContratosItem.vue'),
      props: true,

      children: [
        {
          path: '',
          name: 'contratosDoProjetoEditar',
          component: ContratosCriarEditar,
          props: true,

          meta: {
            títuloParaMenu: 'Editar',

            rotaDeEscape: 'contratosDoProjetoListar',

            rotasParaMigalhasDePão: [
              'contratosDoProjetoListar',
              'contratosDoProjetoResumo',
            ],
          },
        },

        {
          path: 'resumo',
          name: 'contratosDoProjetoResumo',
          component: () => import('@/views/mdo.contratos/ContratosResumo.vue'),
          props: true,
          meta: {
            título: () => {
              const daApi = useProcessosStore()?.emFoco?.processo_sei;

              return daApi ? `Resumo do contrato ${formatProcesso(daApi)}` : 'Resumo de contrato';
            },
            títuloParaMenu: 'Resumo',

            rotasParaMigalhasDePão: [
              'contratosDoProjetoListar',
              'contratosDoProjetoResumo',
              'contratosDoProjetoListar',
            ],
          },
        },
      ],
    },
  ],
};
