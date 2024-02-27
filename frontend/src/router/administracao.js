import { defineAsyncComponent } from 'vue';

import LoadingComponent from '@/components/LoadingComponent.vue';
import { Administracao } from '@/views';
import {
  AddEditDocumentTypes,
  ListDocumentTypes,
} from '@/views/documentTypes';
import {
  AddEditODS,
  ListODS,
} from '@/views/ods';
import {
  AddEditOrganTypes,
  AddEditOrgans,
  ListOrganTypes,
  ListOrgans,
} from '@/views/organs';
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
import { ListRegions } from '@/views/regions';
import {
  AddEditResources,
  ListResources,
} from '@/views/resources';
import {
  AddEditUsers,
  ListUsers,
} from '@/views/users';

import PaineisExternosLista from '@/views/paineisExternos/PaineisExternosLista.vue';
import PaineisExternosCriarEditar from '@/views/paineisExternos/PaineisExternosCriarEditar.vue';
import PaineisExternosRaiz from '@/views/paineisExternos/PaineisExternosRaiz.vue';

import PartidosLista from '@/views/partidos/PartidosLista.vue';
import PartidosCriarEditar from '@/views/partidos/PartidosCriarEditar.vue';
import PartidosRaiz from '@/views/partidos/PartidosRaiz.vue';

import BancadasLista from '@/views/bancada/BancadasLista.vue';
import BancadasCriarEditar from '@/views/bancada/BancadasCriarEditar.vue';
import BancadasRaiz from '@/views/bancada/BancadasRaiz.vue';

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

const TiposDeAcompanhamentoLista = defineAsyncComponent({
  loader: () => import('@/views/tiposDeAcompanhamento/TiposLista.vue'),
  loadingComponent: LoadingComponent,
});
const TiposDeAcompanhamentoCriarEditar = defineAsyncComponent({
  loader: () => import('@/views/tiposDeAcompanhamento/TipoCriarEditar.vue'),
  loadingComponent: LoadingComponent,
});
const TiposDeAcompanhamentoRaiz = defineAsyncComponent({
  loader: () => import('@/views/tiposDeAcompanhamento/TiposRaiz.vue'),
  loadingComponent: LoadingComponent,
});

const rotasParaMenuSecundário = [
  {
    rotas: [
      'gerenciarUsuários',
      'gerenciarPdm',
      'portfoliosListar',
      'tipoDeAcompanhamentoListar',
      'paineisExternosListar',
      'partidosListar',
    ],
  },
  {
    títuloParaGrupoDeLinksNoMenu: 'Formulários básicos',
    rotas: [
      'gerenciarÓrgãos',
      'gerenciarUnidadesDeMedida',
      'gerenciarTiposDeDocumento',
      'gerenciarCategorias',
      'gerenciarRegiões',
    ],
  },
  {
    títuloParaGrupoDeLinksNoMenu: 'Painéis de metas',
    rotas: [
      'gerenciarPainéisDeMetas',
      'gerenciarGruposDePainéisDeMetas',
    ],
  },
];

export default [
  {
    path: '/administracao',
    component: Administracao,
    meta: {
      rotasParaMenuSecundário,
    },
  },
  {
    path: '/usuarios',
    meta: {
      restringirÀsPermissões: 'CadastroPessoa.',
      título: 'Gerenciar usuários',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'gerenciarUsuários',
        path: '',
        component: ListUsers,
      },
      {
        path: 'novo',
        component: AddEditUsers,
      },
      {
        path: 'editar/:id',
        component: AddEditUsers,
      },
    ],
  },
  {
    path: '/orgaos',
    meta: {
      restringirÀsPermissões: 'CadastroOrgao.',
      título: 'Órgãos',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'gerenciarÓrgãos',
        path: '',
        component: ListOrgans,
      },
      {
        path: 'novo',
        component: AddEditOrgans,
      },
      {
        name: 'ÓrgãosItem',
        path: 'editar/:id',
        component: AddEditOrgans,
      },
      {
        path: 'tipos',
        component: ListOrganTypes,
      },
      {
        path: 'tipos/novo',
        component: AddEditOrganTypes,
      },
      {
        path: 'tipos/editar/:id',
        component: AddEditOrganTypes,
      },
    ],
  },
  {
    path: '/unidade-medida',
    meta: {
      restringirÀsPermissões: 'CadastroUnidadeMedida.',
      título: 'Unidades de medida',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'gerenciarUnidadesDeMedida',
        path: '',
        component: ListResources,
      },
      {
        path: 'novo',
        component: AddEditResources,
      },
      {
        path: 'editar/:id',
        component: AddEditResources,
      },
    ],
  },
  {
    path: '/tipo-documento',
    meta: {
      restringirÀsPermissões: 'CadastroTipoDocumento.',
      título: 'Tipos de documento',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'gerenciarTiposDeDocumento',
        path: '',
        component: ListDocumentTypes,
      },
      {
        path: 'novo',
        component: AddEditDocumentTypes,
      },
      {
        path: 'editar/:id',
        component: AddEditDocumentTypes,
      },
    ],
  },
  {
    path: '/categorias',
    meta: {
      restringirÀsPermissões: 'CadastroOds.',
      título: 'Categorias',
      rotasParaMenuSecundário,
    },
    children: [
      {
        path: '',
        name: 'gerenciarCategorias',
        component: ListODS,
      },
      {
        path: 'nova',
        component: AddEditODS,
      },
      {
        path: 'editar/:id',
        component: AddEditODS,
      },
    ],
  },
  {
    path: '/pdm',
    meta: {
      restringirÀsPermissões: 'CadastroPdm.',
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
        component: AddEditPdM,
      },
      {
        path: ':pdm_id',
        component: AddEditPdM,
      },
      {
        path: ':pdm_id/arquivos/novo',
        component: ListPdM,
        props: {
          type: 'novo',
          group: 'arquivos',
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/macrotemas/novo',
        component: ListPdM,
        props: {
          type: 'novo',
          group: 'macrotemas',
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/macrotemas/:id',
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
        props: {
          type: 'novo',
          group: 'subtemas',
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/subtemas/:id',
        component: ListPdM,
        props: {
          type: 'editar',
          group: 'subtemas',
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/temas/novo',
        component: ListPdM,
        props: {
          type: 'novo',
          group: 'temas',
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/temas/:id',
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
        props: {
          type: 'novo',
          group: 'tags',
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/tags/:id',
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
    path: '/paineis',
    meta: {
      restringirÀsPermissões: [
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
    path: '/paineis-grupos',
    meta: {
      restringirÀsPermissões: [
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
  {
    path: '/regioes',
    meta: {
      restringirÀsPermissões: 'CadastroRegiao.',
      título: 'Regiões, subprefeituras e distritos',
      rotasParaMenuSecundário,
    },
    children: [
      {
        path: '',
        name: 'gerenciarRegiões',
        component: ListRegions,
      },
      {
        path: 'novo',
        component: ListRegions,
        props: {
          type: 'novo',
        },
      },
      {
        path: 'novo/:id',
        component: ListRegions,
        props: {
          type: 'novo',
        },
      },
      {
        path: 'novo/:id/:id2',
        component: ListRegions,
        props: {
          type: 'novo',
        },
      },
      {
        path: 'novo/:id/:id2/:id3',
        component: ListRegions,
        props: {
          type: 'novo',
        },
      },
      {
        path: 'editar/:id',
        component: ListRegions,
        props: {
          type: 'editar',
        },
      },
      {
        path: 'editar/:id/:id2',
        component: ListRegions,
        props: {
          type: 'editar',
        },
      },
      {
        path: 'editar/:id/:id2/:id3',
        component: ListRegions,
        props: {
          type: 'editar',
        },
      },
      {
        path: 'editar/:id/:id2/:id3/:id4',
        component: ListRegions,
        props: {
          type: 'editar',
        },
      },
    ],
  },

  {
    path: '/portfolios',
    component: PortfoliosRaiz,
    meta: {
      requerAutenticação: true,
      título: 'Portfolios',
      rotaPrescindeDeChave: true,
      restringirÀsPermissões: 'Projeto.administrar_portfolios',
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
    path: '/paineis-externos',
    component: PaineisExternosRaiz,
    meta: {
      requerAutenticação: true,
      título: 'Painéis Externos',
      rotaPrescindeDeChave: true,
      restringirÀsPermissões: 'CadastroPainelExterno.',
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
    path: '/partidos',
    component: PartidosRaiz,
    meta: {
      requerAutenticação: true,
      título: 'Partidos',
      rotaPrescindeDeChave: true,
      restringirÀsPermissões: 'partidosListar',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'partidosListar',
        path: '',
        component: PartidosLista,
        meta: {
          título: 'Partidos',
        },
      },
      {
        name: 'partidosCriar',
        path: 'novo',
        component: PartidosCriarEditar,
        meta: {
          título: 'Novo partido',
        },
      },
      {
        path: ':partidoId',
        name: 'partidosEditar',
        component: PartidosCriarEditar,
        props: ({ params }) => ({
          ...params,
          ...{ partidoId: Number.parseInt(params.partidoId, 10) || undefined },
        }),

        meta: {
          título: 'Editar partido',
        },
      },
    ],
  },
  {
    path: '/bancadas',
    component: BancadasRaiz,
    meta: {
      requerAutenticação: true,
      title: 'Bancadas',
      rotaPrescindeDeChave: true,
    },
    props: {
      submenu: SubmenuConfig,
    },
    children: [
      {
        name: 'bancadasListar',
        path: '',
        component: BancadasLista,
        meta: {
          título: 'Bancadas',
        },
      },
      {
        name: 'bancadasCriar',
        path: 'novo',
        component: BancadasCriarEditar,
        meta: {
          título: 'Nova bancada',
        },
      },
      {
        path: ':bancadaId',
        name: 'bancadasEditar',
        component: BancadasCriarEditar,
        props: ({ params }) => ({
          ...params,
          ...{ bancadaId: Number.parseInt(params.bancadaId, 10) || undefined },
        }),

        meta: {
          título: 'Editar bancada',
        },
      },
    ],
  },

  {
    path: '/tipos-de-acompanhamento',
    component: TiposDeAcompanhamentoRaiz,
    meta: {
      requerAutenticação: true,
      título: 'Tipos de acompanhamento',
      rotaPrescindeDeChave: true,
      restringirÀsPermissões: 'Projeto.administrar_portfolios',
      rotasParaMenuSecundário,
    },

    children: [
      {
        name: 'tipoDeAcompanhamentoListar',
        path: '',
        component: TiposDeAcompanhamentoLista,
        meta: {
          título: 'Tipos de acompanhamento',
        },
      },
      {
        name: 'tipoDeAcompanhamentoCriar',
        path: 'novo',
        component: TiposDeAcompanhamentoCriarEditar,
        meta: {
          título: 'Novo tipo de acompanhamento',
          rotaDeEscape: 'tipoDeAcompanhamentoListar',
        },
      },
      {
        path: ':tipoDeAtendimentoId',
        name: 'tipoDeAcompanhamentoEditar',
        component: TiposDeAcompanhamentoCriarEditar,
        props: ({ params }) => ({
          ...params,
          ...{ tipoDeAtendimentoId: Number.parseInt(params.tipoDeAtendimentoId, 10) || undefined },
        }),

        meta: {
          título: 'Editar tipo de acompanhamento',
          rotaDeEscape: 'tipoDeAcompanhamentoListar',
        },
      },
    ],
  },
];
