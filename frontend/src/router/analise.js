import AnáliseRaiz from '@/views/analise/AnaliseRaiz.vue';

export default {
  path: '/analise',
  component: AnáliseRaiz,
  name: 'análises',

  props: ({ params, query }) => ({
    ...query,
    opção: Number(query.opcao),
    id: Number(query.id),
    ...params,
  }),

  meta: {
    títuloParaMenu: 'Análise',
    íconeParaMenu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 3C20.1 3 19 4.1 19 5.5c0 .7.3 1.4.8 1.8l-3.5 5.8c-.3-.1-.5-.2-.8-.2-.5 0-1 .2-1.4.4l-3.5-3.5c.2-.3.4-.8.4-1.3C11 7.1 9.9 6 8.5 6S6 7.1 6 8.5c0 .7.3 1.4.8 1.8l-3.5 5.8c-.2 0-.5-.1-.8-.1C1.1 16 0 17.1 0 18.5S1.1 21 2.5 21 5 19.9 5 18.5c0-.7-.3-1.4-.8-1.8l3.5-5.8c.2 0 .5.1.8.1.5 0 1-.2 1.4-.4l3.5 3.5c-.2.4-.4.9-.4 1.4 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0-.7-.3-1.4-.8-1.8l3.5-5.8c.2 0 .5.1.8.1C22.9 8 24 6.9 24 5.5S22.9 3 21.5 3z" /></svg>',
    limitarÀsPermissões: [
      'Reports.dashboard_pdm',
      'Reports.dashboard_programademetas',
      'Reports.dashboard_portfolios',
      'SMAE.espectador_de_painel_externo',
    ],
  },
};
