import { useRoute } from 'vue-router';
import { useContratosStore } from '@/stores/contratos.store';
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
        tituloParaMigalhaDePao: 'Novo',
        rotaDeEscape: 'contratosDoProjetoListar',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
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
            título: 'Editar contrato',
            tituloParaMigalhaDePao: 'Editar contrato',
            rotaDeEscape: 'contratosDoProjetoListar',
            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
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
            título: 'Resumo de contrato',
            tituloParaMigalhaDePao: () => {
              const rotaAtual = useRoute();
              const { emFoco } = useContratosStore(rotaAtual.meta.entidadeMãe);

              if (!emFoco) {
                return 'Resumo de contrato';
              }

              return `Contrato ${emFoco.numero}`;
            },

            títuloParaMenu: 'Resumo',
            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'contratosDoProjetoListar',
              'contratosDoProjetoResumo',
            ],
          },
        },
      ],
    },
  ],
};
