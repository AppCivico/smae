import { useRiscosStore } from '@/stores/riscos.store.ts';
// import PlanosDeAçãoCriarEditar from '@/views/planosDeAcao/PlanosDeAcaoCriarEditar.vue';
// import PlanosDeAçãoItem from '@/views/planosDeAcao/PlanosDeAcaoItem.vue';
import PlanosDeAçãoLista from '@/views/planosDeAcao/PlanosDeAcaoLista.vue';
import PlanosDeAçãoRaiz from '@/views/planosDeAcao/PlanosDeAcaoRaiz.vue';
// import PlanosDeAçãoMonitoramento from '@/views/planosDeAcao/PlanosDeAcaoMonitoramento.vue';

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

  ],
};
