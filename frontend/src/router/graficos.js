import GraficosRaiz from '@/views/graficos/GraficosRaiz.vue';

export default {
  path: '/graficos',
  component: GraficosRaiz,
  name: 'graficos',

  props: ({ params }) => ({
    ...params,
  }),

  meta: {
    títuloParaMenu: 'Painel estratégico',
    limitarÀsPermissões: 'CadastroTransferencia.dashboard',
    entidadeMãe: 'TransferenciasVoluntarias',
    íconeParaMenu: '<svg xmlns="http://www.w3.org/2000/svg"  width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3.75C3 3.55109 3.07902 3.36032 3.21967 3.21967C3.36032 3.07902 3.55109 3 3.75 3C3.94891 3 4.13968 3.07902 4.28033 3.21967C4.42098 3.36032 4.5 3.55109 4.5 3.75V19.5H20.25C20.4489 19.5 20.6397 19.579 20.7803 19.7197C20.921 19.8603 21 20.0511 21 20.25C21 20.4489 20.921 20.6397 20.7803 20.7803C20.6397 20.921 20.4489 21 20.25 21H3.75C3.55109 21 3.36032 20.921 3.21967 20.7803C3.07902 20.6397 3 20.4489 3 20.25V3.75ZM19.5 6.75C19.5 6.61072 19.4612 6.47418 19.388 6.3557C19.3148 6.23722 19.21 6.14147 19.0854 6.07918C18.9608 6.01689 18.8214 5.99052 18.6826 6.00303C18.5439 6.01554 18.4114 6.06643 18.3 6.15L12.7 10.35L8.88 8.104C8.77234 8.04061 8.65054 8.00512 8.52567 8.00075C8.40081 7.99638 8.27683 8.02328 8.165 8.079L5.5 9.411V18.5H19.5V6.75Z"/></svg>',
  },
};
