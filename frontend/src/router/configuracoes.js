import { defineAsyncComponent } from 'vue';

import LoadingComponent from '@/components/LoadingComponent.vue';
import ConfiguracoesRaiz from '@/views/ConfiguracoesRaiz.vue';

import {
  AddEditGrupo,
  AddEditPainel,
  ListGrupos,
  ListPainel,
} from '@/views/paineis';
import {
  AddEditPdM,
  ListPdM,
} from '@/views/pdm';

import PaineisExternosCriarEditar from '@/views/paineisExternos/PaineisExternosCriarEditar.vue';
import PaineisExternosLista from '@/views/paineisExternos/PaineisExternosLista.vue';
import PaineisExternosRaiz from '@/views/paineisExternos/PaineisExternosRaiz.vue';

const PortfoliosCriarEditar = defineAsyncComponent({
  loader: () => import('@/views/portfolios/PortfoliosCriarEditar.vue'),
  loadingComponent: LoadingComponent,
});
const PortfoliosLista = defineAsyncComponent({
  loader: () => import('@/views/portfolios/PortfoliosLista.vue'),
  loadingComponent: LoadingComponent,
});
const PortfoliosRaiz = defineAsyncComponent({
  loader: () => import('@/views/portfolios/PortfoliosRaiz.vue'),
  loadingComponent: LoadingComponent,
});

const GruposDeObservadoresCriarEditar = defineAsyncComponent({
  loader: () => import('@/views/gruposDeObservadores/GruposDeObservadoresCriarEditar.vue'),
  loadingComponent: LoadingComponent,
});
const GruposDeObservadoresLista = defineAsyncComponent({
  loader: () => import('@/views/gruposDeObservadores/GruposDeObservadoresLista.vue'),
  loadingComponent: LoadingComponent,
});
const GruposDeObservadoresRaiz = defineAsyncComponent({
  loader: () => import('@/views/gruposDeObservadores/GruposDeObservadoresRaiz.vue'),
  loadingComponent: LoadingComponent,
});

const rotasParaMenuSecundário = [
  {
    rotas: [
      'gerenciarPdm',
      'portfoliosListar',
      'paineisExternosListar',
    ],
  },
  {
    título: 'Painéis de metas',
    rotas: [
      'gerenciarPainéisDeMetas',
      'gerenciarGruposDePainéisDeMetas',
    ],
  },
];

export default {
  path: '/configuracoes',
  component: ConfiguracoesRaiz,
  meta: {
    limitarÀsPermissões: [
      'CadastroPessoa.',
      'CadastroOrgao.',
      'CadastroUnidadeMedida.',
      'CadastroTipoDocumento.',
      'CadastroOds.',
      'CadastroPdm.',
      'CadastroRegiao.',
      'Projeto.administrar_portfolios',
      'CadastroPainelExterno.',
    ],
    presenteNoMenu: true,
    pesoNoMenu: 1,
    título: 'Configurações',
    íconeParaMenu: '',
    rotasParaMenuSecundário,
    rotasParaMenuPrincipal: [
      'gerenciarPdm',
      'portfoliosListar',
      'gerenciarPainéisDeMetas',
      'gerenciarGruposDePainéisDeMetas',
      'paineisExternosListar',
      'gruposDeObservadoresListar',
    ],
  },

  children: [
    // PDM
    {
      path: 'pdm',
      meta: {
        limitarÀsPermissões: 'CadastroPdm.',
        título: 'Programa de metas',
        rotasParaMenuSecundário,
      },
      children: [
        {
          path: '',
          name: 'gerenciarPdm',
          component: ListPdM,
        },
        {
          path: 'novo',
          name: 'novoPdm',
          component: AddEditPdM,
        },
        {
          path: ':pdm_id',
          name: 'editarPdm',
          component: AddEditPdM,
        },
        {
          path: ':pdm_id/arquivos/novo',
          component: ListPdM,
          name: 'novoArquivoEmPdm',
          props: {
            type: 'novo',
            group: 'arquivos',
            parentPage: 'pdm',
          },
        },
        {
          path: ':pdm_id/macrotemas/novo',
          component: ListPdM,
          name: 'criarMacroTemaEmPdm',
          props: {
            type: 'novo',
            group: 'macrotemas',
            parentPage: 'pdm',
          },
        },
        {
          path: ':pdm_id/macrotemas/:id',
          name: 'editarMacroTemaEmPdm',
          component: ListPdM,
          props: {
            type: 'editar',
            group: 'macrotemas',
            parentPage: 'pdm',
          },
        },
        {
          path: ':pdm_id/subtemas/novo',
          component: ListPdM,
          name: 'criarSubtemaEmPdm',
          props: {
            type: 'novo',
            group: 'subtemas',
            parentPage: 'pdm',
          },
        },
        {
          path: ':pdm_id/subtemas/:id',
          component: ListPdM,
          name: 'editarSubtemaEmPdm',
          props: {
            type: 'editar',
            group: 'subtemas',
            parentPage: 'pdm',
          },
        },
        {
          path: ':pdm_id/temas/novo',
          component: ListPdM,
          name: 'criarTemaEmPdm',
          props: {
            type: 'novo',
            group: 'temas',
            parentPage: 'pdm',
          },
        },
        {
          path: ':pdm_id/temas/:id',
          name: 'editarTemaEmPdm',
          component: ListPdM,
          props: {
            type: 'editar',
            group: 'temas',
            parentPage: 'pdm',
          },
        },
        {
          path: ':pdm_id/tags/novo',
          component: ListPdM,
          name: 'criarTagEmPdm',
          props: {
            type: 'novo',
            group: 'tags',
            parentPage: 'pdm',
          },
        },
        {
          path: ':pdm_id/tags/:id',
          name: 'editarTagEmPdm',
          component: ListPdM,
          props: {
            type: 'editar',
            group: 'tags',
            parentPage: 'pdm',
          },
        },
      ],
    },
    {
      path: 'paineis',
      meta: {
        limitarÀsPermissões: [
          'CadastroPainel.inserir',
          'CadastroMeta.inserir',
        ],
        título: 'Painéis de metas',
        rotasParaMenuSecundário,
      },
      children: [
        {
          path: '',
          name: 'gerenciarPainéisDeMetas',
          component: ListPainel,
        },
        {
          path: 'novo',
          component: AddEditPainel,
        },
        {
          path: ':painel_id',
          component: AddEditPainel,
        },
        {
          path: ':painel_id/metas',
          component: AddEditPainel,
          props: {
            type: 'selecionarMetas',
          },
        },
        {
          path: ':painel_id/metas/:conteudo_id',
          component: AddEditPainel,
          props: {
            type: 'editarMeta',
          },
        },
        {
          path: ':painel_id/metas/:conteudo_id/detalhes',
          component: AddEditPainel,
          props: {
            type: 'editarDetalhe',
          },
        },
      ],
    },
    {
      path: 'paineis-grupos',
      meta: {
        limitarÀsPermissões: [
          'CadastroGrupoPaineis.inserir',
          'CadastroGrupoPaineis.editar',
          'CadastroGrupoPaineis.remover',
        ],
        título: 'Grupos de paineis',
        rotasParaMenuSecundário,
      },

      children: [
        {
          path: '',
          name: 'gerenciarGruposDePainéisDeMetas',
          component: ListGrupos,
        },
        {
          path: 'novo',
          component: AddEditGrupo,
        },
        {
          path: ':grupo_id',
          component: AddEditGrupo,
        },
      ],
    },

    // Projetos
    {
      path: 'portfolios',
      component: PortfoliosRaiz,
      meta: {
        título: 'Portfolios',
        rotaPrescindeDeChave: true,
        limitarÀsPermissões: 'Projeto.administrar_portfolios',
        presenteNoMenu: true,
        rotasParaMenuSecundário,
      },

      children: [
        {
          name: 'portfoliosListar',
          path: '',
          component: PortfoliosLista,
          meta: {
            título: 'Portfolios',
          },
        },
        {
          name: 'portfoliosCriar',
          path: 'novo',
          component: PortfoliosCriarEditar,
          meta: {
            título: 'Novo portfolio',
          },
        },
        {
          path: ':portfolioId',
          name: 'portfoliosEditar',
          component: PortfoliosCriarEditar,
          props: ({ params }) => ({
            ...params,
            ...{ portfolioId: Number.parseInt(params.portfolioId, 10) || undefined },
          }),

          meta: {
            título: 'Editar portfolio',
          },
        },
      ],
    },
    {
      path: 'paineis-externos',
      component: PaineisExternosRaiz,
      meta: {
        título: 'Painéis Externos',
        rotaPrescindeDeChave: true,
        limitarÀsPermissões: 'CadastroPainelExterno.',
        rotasParaMenuSecundário,
      },
      children: [
        {
          name: 'paineisExternosListar',
          path: '',
          component: PaineisExternosLista,
          meta: {
            título: 'Paineis Externos',
          },
        },
        {
          name: 'paineisExternosCriar',
          path: 'novo',
          component: PaineisExternosCriarEditar,
          meta: {
            título: 'Novo painel externo',
          },
        },
        {
          path: ':painelId',
          name: 'paineisExternosEditar',
          component: PaineisExternosCriarEditar,
          props: ({ params }) => ({
            ...params,
            ...{ paineilId: Number.parseInt(params.paineilId, 10) || undefined },
          }),

          meta: {
            título: 'Editar painel externo',
          },
        },
      ],
    },

    {
      path: '/grupos-de-observadores',
      component: GruposDeObservadoresRaiz,
      meta: {
        título: 'Grupos de observadores',
        títuloParaMenu: 'Grupos de observadores',

        limitarÀsPermissões: [
          'Projeto.administrar_portfolios',
          'Projeto.administrador_no_orgao',
        ],
      },

      children: [
        {
          name: 'gruposDeObservadoresListar',
          path: '',
          component: GruposDeObservadoresLista,
          meta: {
            título: 'Grupos de observadores',
          },
        },
        {
          name: 'gruposDeObservadoresCriar',
          path: 'novo',
          component: GruposDeObservadoresCriarEditar,
          meta: {
            título: 'Novo grupo de observadores',
          },
        },
        {
          path: ':grupoDeObservadoresId',
          name: 'gruposDeObservadoresEditar',
          component: GruposDeObservadoresCriarEditar,
          props: ({ params }) => ({
            ...params,
            ...{
              grupoDeObservadoresId: Number.parseInt(params.grupoDeObservadoresId, 10)
                  || undefined,
            },
          }),

          meta: {
            título: 'Editar grupo de observadores',
          },
        },
      ],
    },
  ],
};
