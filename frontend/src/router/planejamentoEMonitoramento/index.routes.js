import prepararRotasParaProgramaDeMetas from './prepararRotasParaPlanejamentoEMonitoramento';

export default [
  {
    path: '/metas-programa-corrente',
    name: 'programaDeMetas.metasDoProgramaCorrente',
    component: () => import(
      '@/views/planosSetoriais/RedirecionamentoParaMetasDoProgramaCorrente.vue'
    ),
    meta: {
      entidadeMãe: 'programaDeMetas',
      presenteNoMenu: true,
      título: 'Metas',
      íconeParaMenu: `<svg width="19" height="22" viewBox="0 0 19 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M15 0H8C7.46957 0 6.96086 0.210712 6.58578 0.585785C6.21071 0.960858 6 1.46957 6 2V14C6 14.5304 6.21071 15.0391 6.58578 15.4142C6.96086 15.7893 7.46957 16 8 16H17C17.5304 16 18.0391 15.7893 18.4142 15.4142C18.7893 15.0391 19 14.5304 19 14V4L15 0ZM17 14H8V2H13V6H17V14Z" />
<path d="M5 5H3V17C3 17.5304 3.21071 18.0391 3.58578 18.4142C3.96086 18.7893 4.46957 19 5 19H14V17H5V5Z" />
<path d="M0 8H2V20H11V22H2C1.46957 22 0.960858 21.7893 0.585785 21.4142C0.210712 21.0391 0 20.5304 0 20V8Z" />
</svg>`,
      limitarÀsPermissões: 'CadastroPDM.',
      pesoNoMenu: 2,
    },
  },
  prepararRotasParaProgramaDeMetas('planoSetorial'),
  prepararRotasParaProgramaDeMetas('programaDeMetas'),
];
