import { defineAsyncComponent } from 'vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import RelatoriosRaiz from '@/views/relatorios/RelatoriosRaiz.vue';

const NovoMensal = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoMensal.vue'),
  loadingComponent: LoadingComponent,
});
const NovoOrcamentarioPdM = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoOrcamentarioPdM.vue'),
  loadingComponent: LoadingComponent,
});
const NovoOrçamentárioPortfolio = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoOrcamentarioPortfolio.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioDePortfolio = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioDePortfolio.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioDePrevisãoDeCustoPdM = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioDePrevisaoDeCustoPdM.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioDePrevisãoDeCustoPortfolio = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioDePrevisaoDeCustoPortfolio.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioDeProjeto = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioDeProjeto.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioDeStatus = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioDeStatus.vue'),
  loadingComponent: LoadingComponent,
});
const NovoSemestralOuAnual = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoSemestralOuAnual.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosDePortfolio = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosDePortfolio.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosDePrevisãoDeCustoPdM = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosDePrevisaoDeCustoPdM.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosDePrevisãoDeCustoPortfolio = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosDePrevisaoDeCustoPortfolio.vue'),
  loadingComponent: LoadingComponent,
});
const RelatoriosDeProjeto = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosDeProjeto.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosDeStatus = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosDeStatus.vue'),
  loadingComponent: LoadingComponent,
});
const RelatoriosMensais = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosMensais.vue'),
  loadingComponent: LoadingComponent,
});
const RelatoriosOrcamentariosPdM = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosOrcamentariosPdM.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosOrçamentáriosPortfolio = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosOrcamentariosPortfolio.vue'),
  loadingComponent: LoadingComponent,
});
const RelatoriosSemestraisOuAnuais = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosSemestraisOuAnuais.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioDePortfolioObras = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioDePortfolioObras.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosDePortfolioObras = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosDePortfolioObras.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioDeStatusObras = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioDeStatusObras.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosDeStatusObras = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosDeStatusObras.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioDePrevisãoDeCustoPortfolioObras = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioDePrevisaoDeCustoPortfolioObras.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosDePrevisãoDeCustoPortfolioObras = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosDePrevisaoDeCustoPortfolioObras.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioOrçamentárioPortfolioObras = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioOrcamentarioPortfolioObras.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosOrçamentáriosPortfolioObras = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosOrcamentariosPortfolioObras.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosDePrevisãoDeCustoPlanosSetoriais = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosDePrevisaoDeCustoPlanosSetoriais.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioDePrevisãoDeCustoPlanosSetoriais = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioDePrevisaoDeCustoPlanosSetoriais.vue'),
  loadingComponent: LoadingComponent,
});
const RelatóriosOrçamentáriosPlanosSetoriais = defineAsyncComponent({
  loader: () => import('@/views/relatorios/RelatoriosOrcamentariosPlanosSetoriais.vue'),
  loadingComponent: LoadingComponent,
});
const NovoRelatórioOrçamentárioPlanosSetoriais = defineAsyncComponent({
  loader: () => import('@/views/relatorios/NovoRelatorioOrcamentarioPlanosSetoriais.vue'),
  loadingComponent: LoadingComponent,
});

export default {
  path: '/relatorios',
  component: RelatoriosRaiz,

  meta: {
    presenteNoMenu: true,
    títuloParaMenu: 'Relatórios',
    íconeParaMenu: `<svg width="18" height="22" viewBox="0 0 18 22" fill="currentColor">
<path fill-rule="evenodd" clip-rule="evenodd" d="M10 2.01991C9.8143 2.00299 9.53915 2.00006 9.01178 2.00006H5.8C4.94342 2.00006 4.36113 2.00084 3.91104 2.03761C3.47262 2.07343 3.24842 2.13836 3.09202 2.21805C2.7157 2.4098 2.40973 2.71576 2.21799 3.09208C2.1383 3.24848 2.07337 3.47269 2.03755 3.9111C2.00078 4.36119 2 4.94348 2 5.80006V16.2001C2 17.0566 2.00078 17.6389 2.03755 18.089C2.07337 18.5274 2.1383 18.7516 2.21799 18.908C2.40973 19.2844 2.7157 19.5903 3.09202 19.7821C3.24842 19.8618 3.47262 19.9267 3.91104 19.9625C4.36113 19.9993 4.94342 20.0001 5.8 20.0001H12.2C13.0566 20.0001 13.6389 19.9993 14.089 19.9625C14.5274 19.9267 14.7516 19.8618 14.908 19.7821C15.2843 19.5903 15.5903 19.2844 15.782 18.908C15.8617 18.7516 15.9266 18.5274 15.9624 18.089C15.9992 17.6389 16 17.0566 16 16.2001V8.98829C16 8.46099 15.9971 8.18583 15.9802 8.00013L12.5681 8.00014C12.3157 8.00017 12.0699 8.0002 11.8618 7.98319C11.6332 7.96451 11.3634 7.92044 11.092 7.78215C10.7157 7.5904 10.4097 7.28444 10.218 6.90812C10.0797 6.63669 10.0356 6.36696 10.0169 6.13836C9.99994 5.9302 9.99997 5.6844 10 5.43202L10 2.01991ZM11.3936 0.350029C11.1677 0.248769 10.9326 0.168544 10.6911 0.110583C10.2284 -0.000499591 9.74865 -0.000271186 9.11366 3.08906e-05C9.08014 4.68646e-05 9.04618 6.30771e-05 9.01178 6.30771e-05L5.7587 6.26003e-05C4.95373 4.98449e-05 4.28937 3.9354e-05 3.74817 0.0442567C3.18608 0.0901819 2.66937 0.188746 2.18404 0.436037C1.43139 0.81953 0.819468 1.43145 0.435975 2.1841C0.188684 2.66944 0.0901197 3.18614 0.0441945 3.74824C-2.28137e-05 4.28943 -1.23241e-05 4.95379 4.31292e-07 5.75876V16.2414C-1.23241e-05 17.0463 -2.28137e-05 17.7107 0.0441945 18.2519C0.0901197 18.814 0.188684 19.3307 0.435975 19.816C0.819468 20.5687 1.43139 21.1806 2.18404 21.5641C2.66937 21.8114 3.18608 21.9099 3.74817 21.9559C4.28936 22.0001 4.95372 22.0001 5.75868 22.0001H12.2413C13.0463 22.0001 13.7106 22.0001 14.2518 21.9559C14.8139 21.9099 15.3306 21.8114 15.816 21.5641C16.5686 21.1806 17.1805 20.5687 17.564 19.816C17.8113 19.3307 17.9099 18.814 17.9558 18.2519C18 17.7107 18 17.0463 18 16.2414V8.98829C18 8.95389 18 8.91994 18 8.88642C18.0003 8.25142 18.0006 7.77162 17.8895 7.30892C17.8317 7.06819 17.7518 6.83372 17.6509 6.60843C17.6447 6.59375 17.6381 6.57925 17.6311 6.56494C17.5658 6.42355 17.4922 6.28589 17.4106 6.15271C17.1619 5.74698 16.8225 5.40788 16.3733 4.95907C16.3496 4.93539 16.3255 4.91139 16.3012 4.88707L13.113 1.69884C13.0887 1.67452 13.0647 1.6505 13.041 1.62678C12.5922 1.17756 12.2531 0.838129 11.8474 0.589502C11.7136 0.507556 11.5754 0.433665 11.4334 0.368139C11.4203 0.361822 11.407 0.355783 11.3936 0.350029ZM12 3.41428V5.40014C12 5.69666 12.0008 5.85892 12.0103 5.9755C12.0107 5.98014 12.0111 5.98454 12.0114 5.98869C12.0156 5.98907 12.02 5.98945 12.0246 5.98983C12.1412 5.99936 12.3035 6.00013 12.6 6.00013H14.5859L12 3.41428ZM9 8.50006C9.55229 8.50006 10 8.94778 10 9.50006V17.0001C10 17.5523 9.55229 18.0001 9 18.0001C8.44772 18.0001 8 17.5523 8 17.0001V9.50006C8 8.94778 8.44772 8.50006 9 8.50006ZM13 11.0001C13.5523 11.0001 14 11.4478 14 12.0001V17.0001C14 17.5523 13.5523 18.0001 13 18.0001C12.4477 18.0001 12 17.5523 12 17.0001V12.0001C12 11.4478 12.4477 11.0001 13 11.0001ZM5 13.0001C5.55229 13.0001 6 13.4478 6 14.0001V17.0001C6 17.5523 5.55229 18.0001 5 18.0001C4.44772 18.0001 4 17.5523 4 17.0001V14.0001C4 13.4478 4.44772 13.0001 5 13.0001Z" />
</svg>`,
    pesoNoMenu: 3,
    limitarÀsPermissões: ['Reports.executar.', 'Reports.remover.'],
    rotasParaMenuPrincipal: [
      /// PdM
      'RelatóriosMensais',
      'pdm.RelatóriosSemestraisOuAnuais',
      'RelatóriosDePrevisãoDeCustoPdM',
      'RelatóriosOrçamentáriosPdM',

      /// PlanoSetorial
      'planoSetorial.RelatóriosMensais',
      'planoSetorial.RelatóriosSemestraisOuAnuais',

      /// Projetos
      'RelatóriosDeProjeto',
      'RelatóriosDePortfolio',
      'RelatóriosDeStatus',
      'RelatóriosDePrevisãoDeCustoPortfolio',
      'RelatóriosOrçamentáriosPortfolio',

      /// CasaCivil
      'RelatóriosDeParlamentares',
      'RelatóriosDeTransferênciasVoluntárias',
      'RelatóriosDeTribunalDeContas',
      'RelatóriosDeAtividadesPendentes',

      // MDO
      'RelatóriosDePortfolioObras',
      'RelatóriosDeStatusObras',
      'RelatóriosDePrevisãoDeCustoPortfolioObras',
      'RelatóriosOrçamentáriosPortfolioObras',

      // Planos Setoriais
      'RelatóriosDePrevisãoDeCustoPlanosSetoriais',
      'RelatóriosOrçamentáriosPlanosSetoriais',
    ],
  },

  children: [
    {
      path: '',
    },
    {
      path: 'mensal',
      meta: {
        entidadeMãe: 'pdm',
        título: 'Relatórios Mensais',
        títuloParaMenu: 'Relatório Mensal',
        limitarÀsPermissões: [
          'Reports.executar.PDM',
        ],
      },
      children: [
        {
          path: '',
          name: 'RelatóriosMensais',
          component: RelatoriosMensais,
        },
        {
          component: NovoMensal,
          path: 'novo',
          name: 'novoRelatórioMensal',
          meta: {
            título: 'Novo relatório mensal',
            rotaDeEscape: 'RelatóriosMensais',
          },
        },
      ],
    },

    {
      path: 'semestral-ou-anual',
      meta: {
        entidadeMãe: 'pdm',
        título: 'Relatórios Semestrais e Anuais',
        fonteParaRelatório: 'Indicadores',
        títuloParaMenu: 'Relatório Semestral/Anual',
        limitarÀsPermissões: 'Reports.executar.PDM',
      },
      children: [
        {
          path: '',
          name: 'pdm.RelatóriosSemestraisOuAnuais',
          component: RelatoriosSemestraisOuAnuais,
        },
        {
          component: NovoSemestralOuAnual,
          path: 'novo',
          name: 'pdm.novoRelatórioSemestralOuAnual',
          meta: {
            título: 'Novo relatório semestral ou anual',
            rotaDeEscape: 'pdm.RelatóriosSemestraisOuAnuais',
          },
        },
      ],
    },

    {
      path: 'orcamentarios-pdm',
      meta: {
        entidadeMãe: 'pdm',
        título: 'Relatórios orçamentários do PdM',
        títuloParaMenu: 'Relatórios orçamentários',
        limitarÀsPermissões: 'Reports.executar.PDM',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosOrçamentáriosPdM',
          component: RelatoriosOrcamentariosPdM,
        },
        {
          component: NovoOrcamentarioPdM,
          path: 'novo',
          name: 'novoRelatórioOrçamentárioPdM',
          meta: {
            título: 'Novo relatório orçamentário de PdM',
            rotaDeEscape: 'RelatóriosOrçamentáriosPdM',
          },
        },
      ],
    },

    {
      path: 'orcamentarios-portfolio',
      meta: {
        título: 'Relatórios orçamentários de portfólio',
        títuloParaMenu: 'Execução orçamentária',
        limitarÀsPermissões: 'Reports.executar.Projetos',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosOrçamentáriosPortfolio',
          component: RelatóriosOrçamentáriosPortfolio,
        },
        {
          component: NovoOrçamentárioPortfolio,
          path: 'novo',
          name: 'novoRelatórioOrçamentárioPortfolio',
          meta: {
            título: 'Novo relatório orçamentário de portfólio',
            rotaDeEscape: 'RelatóriosOrçamentáriosPortfolio',
          },
        },
      ],
    },

    {
      path: 'parlamentares',
      meta: {
        título: 'Relatórios de parlamentares',
        títuloParaMenu: 'Parlamentares',
        limitarÀsPermissões: 'Reports.executar.CasaCivil',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDeParlamentares',
          component: () => import('@/views/relatorios/RelatoriosDeParlamentares.vue'),
        },
        {
          component: () => import('@/views/relatorios/NovoRelatorioDeParlamentares.vue'),
          path: 'novo',
          name: 'novoRelatórioDeParlamentares',
          meta: {
            título: 'Novo relatório de parlamentares',
            rotaDeEscape: 'RelatóriosDeParlamentares',
          },
        },
      ],
    },

    {
      path: 'transferencias-voluntarias',
      meta: {
        título: 'Relatórios de transferências voluntárias',
        títuloParaMenu: 'Transferências voluntárias',
        limitarÀsPermissões: 'Reports.executar.CasaCivil',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDeTransferênciasVoluntárias',
          component: () => import(
            '@/views/relatorios/RelatoriosDeTransferenciasVoluntarias.vue'
          ),
        },
        {
          component: () => import(
            '@/views/relatorios/NovoRelatorioDeTransferenciasVoluntarias.vue'
          ),
          path: 'novo',
          name: 'novoRelatórioDeTransferênciasVoluntárias',
          meta: {
            título: 'Novo relatório de transferências voluntárias',
            rotaDeEscape: 'RelatóriosDeTransferênciasVoluntárias',
          },
        },
      ],
    },

    {
      path: 'tribunal-de-contas',
      meta: {
        título: 'Relatórios de tribunal de contas',
        títuloParaMenu: 'Tribunal de contas',
        limitarÀsPermissões: 'Reports.executar.CasaCivil',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDeTribunalDeContas',
          component: () => import('@/views/relatorios/RelatoriosDeTribunalDeContas.vue'),
        },
        {
          component: () => import('@/views/relatorios/NovoRelatorioDeTribunalDeContas.vue'),
          path: 'novo',
          name: 'novoRelatórioDeTribunalDeContas',
          meta: {
            título: 'Novo relatório do tribunal de contas',
            rotaDeEscape: 'RelatóriosDeTribunalDeContas',
          },
        },
      ],
    },

    {
      path: 'atividades-pendentes',
      meta: {
        título: 'Novo Relatório de Atividades Pendentes',
        títuloParaMenu: 'Atividades pendentes',
        limitarÀsPermissões: 'Reports.executar.CasaCivil',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDeAtividadesPendentes',
          component: () => import('@/views/relatorios/RelatoriosDeAtividadesPendentes.vue'),
        },
        {
          component: () => import('@/views/relatorios/NovoRelatorioDeAtividadesPendentes.vue'),
          path: 'novo',
          name: 'novoRelatórioDeAtividadePendente',
          meta: {
            título: 'Nova atividade pendente',
            rotaDeEscape: 'RelatóriosDeAtividadesPendentes',
          },
        },
      ],
    },

    {
      path: 'projeto',
      meta: {
        título: 'Relatórios de projeto',
        títuloParaMenu: 'Relatório de projeto',
        limitarÀsPermissões: 'Reports.executar.Projetos',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDeProjeto',
          component: RelatoriosDeProjeto,
        },
        {
          component: NovoRelatórioDeProjeto,
          path: 'novo',
          name: 'novoRelatórioDeProjeto',
          meta: {
            título: 'Novo relatório de projeto',
            rotaDeEscape: 'RelatóriosDeProjeto',
          },
        },
      ],
    },

    {
      path: 'previsao-de-custo-pdm',
      meta: {
        entidadeMãe: 'pdm',
        título: 'Relatórios de previsão de custo de PdM',
        títuloParaMenu: 'Previsão de custo',
        limitarÀsPermissões: 'Reports.executar.PDM',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDePrevisãoDeCustoPdM',
          component: RelatóriosDePrevisãoDeCustoPdM,
        },
        {
          path: 'novo',
          name: 'novoRelatórioDePrevisãoDeCustoPdM',
          component: NovoRelatórioDePrevisãoDeCustoPdM,
          meta: {
            título: 'Novo relatório de previsão de custo de PdM',
          },
        },
      ],
    },

    {
      path: 'previsao-de-custo-portfolio',
      meta: {
        título: 'Relatórios de previsão de custo de portfólio',
        títuloParaMenu: 'Previsão de custo',
        limitarÀsPermissões: 'Reports.executar.Projetos',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDePrevisãoDeCustoPortfolio',
          component: RelatóriosDePrevisãoDeCustoPortfolio,
        },
        {
          path: 'novo',
          name: 'novoRelatórioDePrevisãoDeCustoPortfolio',
          component: NovoRelatórioDePrevisãoDeCustoPortfolio,
          meta: {
            título: 'Novo relatório de previsão de custo de portfólio',
            rotaDeEscape: 'RelatóriosDePrevisãoDeCustoPortfolio',
          },
        },
      ],
    },

    {
      path: 'portfolio',
      meta: {
        título: 'Relatórios de portfólio',
        títuloParaMenu: 'Relatório de portfólio',
        limitarÀsPermissões: 'Reports.executar.Projetos',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDePortfolio',
          component: RelatóriosDePortfolio,
        },
        {
          component: NovoRelatórioDePortfolio,
          path: 'novo',
          name: 'novoRelatórioDePortfolio',
          meta: {
            título: 'Novo relatório de portfólio',
            rotaDeEscape: 'RelatóriosDePortfolio',
          },
        },
      ],
    },

    {
      path: 'projeto-e-status',
      meta: {
        título: 'Relatórios de status',
        títuloParaMenu: 'Relatório de status',
        limitarÀsPermissões: 'Reports.executar.Projetos',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDeStatus',
          component: RelatóriosDeStatus,
        },
        {
          component: NovoRelatórioDeStatus,
          path: 'novo',
          name: 'novoRelatórioDeStatus',
          meta: {
            título: 'Novo relatório de status',
            rotaDeEscape: 'RelatóriosDeStatus',
          },
        },
      ],
    },

    {
      path: 'portfolio-obras',
      meta: {
        título: 'Relatórios de portfólio de Obras',
        títuloParaMenu: 'Relatório de portfólio',
        limitarÀsPermissões: 'Reports.executar.MDO',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDePortfolioObras',
          component: RelatóriosDePortfolioObras,
        },
        {
          component: NovoRelatórioDePortfolioObras,
          path: 'novo',
          name: 'novoRelatórioDePortfolioObras',
          meta: {
            título: 'Novo relatório de portfólio',
            rotaDeEscape: 'RelatóriosDePortfolioObras',
          },
        },
      ],
    },

    {
      path: 'obra-e-status',
      meta: {
        título: 'Relatórios de status',
        títuloParaMenu: 'Relatório de status',
        limitarÀsPermissões: 'Reports.executar.MDO',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDeStatusObras',
          component: RelatóriosDeStatusObras,
        },
        {
          component: NovoRelatórioDeStatusObras,
          path: 'novo',
          name: 'NovoRelatórioDeStatusObras',
          meta: {
            título: 'Novo relatório de status',
            rotaDeEscape: 'RelatóriosDeStatusObras',
          },
        },
      ],
    },

    {
      path: 'previsao-de-custo-portfolio-obras',
      meta: {
        título: 'Relatórios de previsão de custo de portfólio de obras',
        títuloParaMenu: 'Previsão de custo',
        limitarÀsPermissões: 'Reports.executar.MDO',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDePrevisãoDeCustoPortfolioObras',
          component: RelatóriosDePrevisãoDeCustoPortfolioObras,
        },
        {
          path: 'novo',
          name: 'novoRelatórioDePrevisãoDeCustoPortfolioObras',
          component: NovoRelatórioDePrevisãoDeCustoPortfolioObras,
          meta: {
            título: 'Novo relatório de previsão de custo de portfólio de obras',
            rotaDeEscape: 'RelatóriosDePrevisãoDeCustoPortfolioObras',
          },
        },
      ],
    },

    {
      path: 'orcamentarios-portfolio-obras',
      meta: {
        título: 'Relatórios orçamentários de portfólio de obras',
        títuloParaMenu: 'Execução orçamentária',
        limitarÀsPermissões: 'Reports.executar.MDO',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosOrçamentáriosPortfolioObras',
          component: RelatóriosOrçamentáriosPortfolioObras,
        },
        {
          component: NovoRelatórioOrçamentárioPortfolioObras,
          path: 'novo',
          name: 'novoRelatórioOrçamentárioPortfolioObras',
          meta: {
            título: 'Novo relatório orçamentário de portfólio de obras',
            rotaDeEscape: 'RelatóriosOrçamentáriosPortfolioObras',
          },
        },
      ],
    },

    // ******** Planos Setoriais ******** //
    {
      path: 'previsao-de-custo-planos-setoriais',
      meta: {
        entidadeMãe: 'planoSetorial',
        título: 'Relatórios de previsão de custo de Planos Setoriais',
        títuloParaMenu: undefined,
        limitarÀsPermissões: 'Reports.executar.PlanoSetorial',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosDePrevisãoDeCustoPlanosSetoriais',
          component: RelatóriosDePrevisãoDeCustoPlanosSetoriais,
        },
        {
          path: 'novo',
          name: 'novoRelatórioDePrevisãoDeCustoPlanosSetoriais',
          component: NovoRelatórioDePrevisãoDeCustoPlanosSetoriais,
          meta: {
            título: 'Novo relatório de previsão de custo de Planos Setoriais',
            rotasParaMigalhasDePão: ['RelatóriosDePrevisãoDeCustoPlanosSetoriais'],
          },
        },
      ],
    },

    {
      path: 'ps/mensal',
      component: () => import('@/views/relatorios/planosSetoriais/RelatoriosMensaisRaizPS.vue'),
      meta: {
        entidadeMãe: 'planoSetorial',
        título: 'Relatórios Mensais',
        títuloParaMenu: undefined,
        limitarÀsPermissões: [
          'Reports.executar.PlanoSetorial',
        ],
      },
      children: [
        {
          path: '',
          name: 'planoSetorial.RelatóriosMensais',
          component: () => import('@/views/relatorios/planosSetoriais/RelatoriosMensaisPS.vue'),
        },
        {
          component: () => import('@/views/relatorios/planosSetoriais/NovoMensalPS.vue'),
          path: 'novo',
          name: 'planoSetorial.novoRelatórioMensal',
          meta: {
            título: 'Novo relatório mensal',
            rotaDeEscape: 'planoSetorial.RelatóriosMensais',
            rotasParaMigalhasDePão: ['planoSetorial.RelatóriosMensais'],
          },
        },
      ],
    },

    {
      path: 'ps/semestral-ou-anual',
      meta: {
        entidadeMãe: 'planoSetorial',
        fonteParaRelatório: 'PSIndicadores',
        título: 'Relatórios Semestrais e Anuais',
        títuloParaMenu: undefined,
        limitarÀsPermissões: 'Reports.executar.PlanoSetorial',
      },

      children: [
        {
          path: '',
          name: 'planoSetorial.RelatóriosSemestraisOuAnuais',
          component: () => import('@/views/relatorios/RelatoriosSemestraisOuAnuais.vue'), //
        },
        {
          component: () => import('@/views/relatorios/NovoSemestralOuAnual.vue'),
          path: 'novo',
          name: 'planoSetorial.novoRelatórioSemestralOuAnual',
          meta: {
            título: 'Novo relatório semestral ou anual',
            rotaDeEscape: 'planoSetorial.RelatóriosSemestraisOuAnuais',
            rotasParaMigalhasDePão: ['planoSetorial.RelatóriosSemestraisOuAnuais'],
          },
        },
      ],
    },

    {
      path: 'orcamentarios-planos-setoriais',
      meta: {
        título: 'Relatórios orçamentários de Planos Setoriais',
        títuloParaMenu: undefined,
        limitarÀsPermissões: 'Reports.executar.PlanoSetorial',
      },
      children: [
        {
          path: '',
          name: 'RelatóriosOrçamentáriosPlanosSetoriais',
          component: RelatóriosOrçamentáriosPlanosSetoriais,
        },
        {
          component: NovoRelatórioOrçamentárioPlanosSetoriais,
          path: 'novo',
          name: 'novoRelatórioOrçamentárioPlanosSetoriais',
          meta: {
            título: 'Novo relatório orçamentário de Planos Setoriais',
            rotaDeEscape: 'RelatóriosOrçamentáriosPlanosSetoriais',
            rotasParaMigalhasDePão: ['RelatóriosOrçamentáriosPlanosSetoriais'],
          },
        },
      ],
    },
  ],
};
