export default {
  path: '/painel-estrategico',
  component: () => import('@/views/gp.painelEstrategico/PainelEstrategicoRaiz.vue'),
  name: 'painelEstrategico',

  meta: {
    título: 'Painel estratégico',
    classeRaiz: 'pagina-de-painel-estrategico',
    entidadeMãe: 'projeto',
    limitarÀsPermissões: [
      'SMAE.gestor_de_projeto',
      'SMAE.colaborador_de_projeto',
      'SMAE.espectador_de_projeto',
    ],
  },
};
