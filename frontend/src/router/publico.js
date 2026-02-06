import DemandaPublicaDetalhe from '@/views/publico/demanda/DemandaPublicaDetalhe.vue';
import PublicLayout from '@/views/publico/PublicLayout.vue';

export default {
  path: '/publico',
  component: PublicLayout,
  children: [
    {
      path: 'demanda/:id',
      name: 'demandaPublica',
      component: DemandaPublicaDetalhe,
      meta: {
        título: 'Informações da Demanda',
      },
    },
  ],
};
