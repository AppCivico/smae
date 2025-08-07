import { useRoute } from 'vue-router';
import formatProcesso from '@/helpers/formatProcesso';
import { useContratosStore } from '@/stores/contratos.store';
import { useProcessosStore } from '@/stores/processos.store.ts';
import ContratosCriarEditar from '@/views/mdo.contratos/ContratosCriarEditar.vue';

export default {
  path: 'contratos',
  component: () => import('@/views/mdo.contratos/ContratosRaiz.vue'),
  props: true,
  children: [
    {
      name: 'contratosDaObraListar',
      path: '',
      component: () => import('@/views/mdo.contratos/ContratosLista.vue'),
      meta: {
        título: 'Contratos da obra',
        títuloParaMenu: 'Contratos',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
        ],
      },
      props: true,
    },

    {
      name: 'contratosDaObraCriar',
      path: 'novo',
      component: ContratosCriarEditar,
      meta: {
        título: 'Novo contrato',
        títuloParaMenu: 'Novo contrato',

        rotaDeEscape: 'contratosDaObraListar',

        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'contratosDaObraListar',
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
          name: 'contratosDaObraEditar',
          component: ContratosCriarEditar,
          props: true,

          meta: {
            títuloParaMenu: 'Editar processo',
            rotaDeEscape: 'contratosDaObraListar',
            rotasParaMigalhasDePão: [
              'obrasListar',
              'obrasResumo',
              'contratosDaObraListar',
              'contratosDaObraResumo',
            ],
          },
        },

        {
          path: 'resumo',
          name: 'contratosDaObraResumo',
          component: () => import('@/views/mdo.contratos/ContratosResumo.vue'),
          props: true,
          meta: {
            tituloParaMigalhaDePao: () => {
              const route = useRoute();
              const { emFoco } = useContratosStore(route.meta.entidadeMãe);

              if (!emFoco) {
                return 'Contrato';
              }

              return `Contrato ${emFoco.numero}`;
            },
            título: () => {
              const daApi = useProcessosStore()?.emFoco?.processo_sei;

              return daApi
                ? `Resumo do contrato ${formatProcesso(daApi)}`
                : 'Resumo de contrato';
            },
            títuloParaMenu: 'Resumo',
            rotasParaMigalhasDePão: [
              'obrasListar',
              'obrasResumo',
              'contratosDaObraListar',
              'contratosDaObraResumo',
            ],
          },
        },
      ],
    },
  ],
};
