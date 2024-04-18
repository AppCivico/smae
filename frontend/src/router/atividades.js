import AtividadesLista from '@/views/atividades/AtividadesLista.vue';
import AtividadesRaiz from '@/views/atividades/AtividadesRaiz.vue';

export default {
  path: '/quadro-de-atividades',
  component: AtividadesRaiz,
  redirect: '/projetos/todos',
  meta: {
    título: 'Atividades',
  },
  children: [
    {
      name: 'AtividadesListar',
      path: '',
      component: AtividadesLista,
      meta: {
        título: 'Quadro de atividades',
        títuloParaMenu: 'Atividades',
      },
    },
  ],
};
