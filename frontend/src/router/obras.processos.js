import formatProcesso from '@/helpers/formatProcesso';
import { useProcessosStore } from '@/stores/processos.store.ts';
import ProcessosCriarEditar from '@/views/mdo.processos/ProcessosCriarEditar.vue';

export default {
  path: 'processos',
  component: () => import('@/views/mdo.processos/ProcessosRaiz.vue'),

  props: true,

  children: [
    {
      name: 'processosDaObraListar',
      path: '',
      component: () => import('@/views/mdo.processos/ProcessosLista.vue'),
      meta: {
        título: 'Processos SEI da obra',
        títuloParaMenu: 'Processos SEI',

        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
        ],
      },
      props: true,
    },

    {
      name: 'processosDaObraCriar',
      path: 'novo',
      component: ProcessosCriarEditar,
      meta: {
        título: 'Novo processo',
        títuloParaMenu: 'Novo processo',

        rotaDeEscape: 'processosDaObraListar',

        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'processosDaObraListar',
        ],
      },
    },

    {
      path: ':processoId',
      component: () => import('@/views/mdo.processos/ProcessosItem.vue'),
      props: true,

      children: [
        {
          path: '',
          name: 'processosDaObraEditar',
          component: ProcessosCriarEditar,
          props: true,

          meta: {
            título: () => {
              const daApi = useProcessosStore()?.emFoco?.processo_sei;

              return daApi ? `Editar processo SEI ${formatProcesso(daApi)}` : 'Editar processo';
            },
            títuloParaMenu: 'Editar processo',

            rotaDeEscape: 'processosDaObraListar',

            rotasParaMigalhasDePão: [
              'obrasListar',
              'obrasResumo',
              'processosDaObraListar',
            ],
          },
        },

        {
          path: 'resumo',
          name: 'processosDaObraResumo',
          component: () => import('@/views/mdo.processos/ProcessosResumo.vue'),
          props: true,
          meta: {
            título: () => {
              const daApi = useProcessosStore()?.emFoco?.processo_sei;

              return daApi ? `Resumo do processo SEI ${formatProcesso(daApi)}` : 'Resumo de processo';
            },
            títuloParaMenu: 'Resumo',

            rotasParaMigalhasDePão: [
              'obrasListar',
              'obrasResumo',
              'processosDaObraListar',
            ],
          },
        },
      ],
    },
  ],
};
