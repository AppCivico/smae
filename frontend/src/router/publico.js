import tiparPropsDeRota from '@/router/helpers/tiparPropsDeRota';
import { useDemandaPublicaStore } from '@/stores/demandaPublica.store';
import DemandaPublicaDetalhe from '@/views/publico/demanda/DemandaPublicaDetalhe.vue';
import DemandasLista from '@/views/publico/demanda/DemandasLista.vue';
import PublicLayout from '@/views/publico/PublicLayout.vue';

export default {
  path: '/publico',
  component: PublicLayout,
  meta: {
    publico: true,
  },
  children: [
    {
      path: 'demandas',
      name: 'demandasPublicas',
      component: DemandasLista,
      meta: {
        título: 'Portfólio de Demandas',
      },
    },
    {
      path: 'demandas/:id',
      name: 'demandaPublica',
      component: DemandaPublicaDetalhe,
      props: tiparPropsDeRota,
      meta: {
        título: 'Informações da Demanda',
        tituloParaMigalhaDePao: () => {
          const { emFoco } = useDemandaPublicaStore();

          if (!emFoco?.nome_projeto) {
            return 'Informações da Demanda';
          }

          return emFoco.nome_projeto;
        },
        rotasParaMigalhasDePão: [
          'demandasPublicas',
        ],
      },
    },
  ],
};
