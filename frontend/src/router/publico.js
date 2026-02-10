import tiparPropsDeRota from '@/router/helpers/tiparPropsDeRota';
import DemandaPublicaDetalhe from '@/views/publico/demanda/DemandaPublicaDetalhe.vue';
import PublicLayout from '@/views/publico/PublicLayout.vue';

export default {
  path: '/publico',
  component: PublicLayout,
  meta: {
    publico: true,
  },
  children: [
    {
      path: 'demandas/:id',
      name: 'demandaPublica',
      component: DemandaPublicaDetalhe,
      props: tiparPropsDeRota,
      meta: {
        título: 'Informações da Demanda',
      },
    },
  ],
};
