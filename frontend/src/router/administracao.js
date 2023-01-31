import { default as SubmenuConfig } from '@/components/SubmenuConfig.vue';
import { Administracao } from '@/views';
import {
  AddEditDocumentTypes,
  ListDocumentTypes
} from '@/views/documentTypes';
import {
  AddEditODS,
  ListODS
} from '@/views/ods';
import {
  AddEditOrgans,
  AddEditOrganTypes,
  ListOrgans,
  ListOrganTypes
} from '@/views/organs';
import {
  AddEditGrupo,
  AddEditPainel,
  ListGrupos,
  ListPainel
} from '@/views/paineis';
import {
  AddEditPdM,
  ListPdM
} from '@/views/pdm';

import { PortfoliosLista } from '@/views/portfolios';
import { ListRegions } from '@/views/regions';
import {
  AddEditResources,
  ListResources
} from '@/views/resources';
import {
  AddEditUsers,
  ListUsers
} from '@/views/users';

export default [
  {
    path: '/administracao',
    component: Administracao,
    props: {
      submenu: SubmenuConfig,
    },
  },
  {
    path: '/usuarios',
    children: [
      {
        path: '',
        component: ListUsers,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo',
        component: AddEditUsers,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'editar/:id',
        component: AddEditUsers,
        props: {
          submenu: SubmenuConfig,
        },
      },
    ],
  },
  {
    path: '/orgaos',
    children: [
      {
        path: '',
        component: ListOrgans,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo',
        component: AddEditOrgans,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        name: 'ÓrgãosItem',
        path: 'editar/:id',
        component: AddEditOrgans,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'tipos',
        component: ListOrganTypes,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'tipos/novo',
        component: AddEditOrganTypes,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'tipos/editar/:id',
        component: AddEditOrganTypes,
        props: {
          submenu: SubmenuConfig,
        },
      },
    ],
  },
  {
    path: '/fonte-recurso',
    children: [
      {
        path: '',
        component: ListResources,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo',
        component: AddEditResources,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'editar/:id',
        component: AddEditResources,
        props: {
          submenu: SubmenuConfig,
        },
      },
    ],
  },
  {
    path: '/tipo-documento',
    children: [
      {
        path: '',
        component: ListDocumentTypes,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo',
        component: AddEditDocumentTypes,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'editar/:id',
        component: AddEditDocumentTypes,
        props: {
          submenu: SubmenuConfig,
        },
      },
    ],
  },
  {
    path: '/ods',
    children: [
      {
        path: '',
        component: ListODS,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo',
        component: AddEditODS,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'editar/:id',
        component: AddEditODS,
        props: {
          submenu: SubmenuConfig,
        },
      },
    ],
  },
  {
    path: '/pdm',
    children: [
      {
        path: '',
        component: ListPdM,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo',
        component: AddEditPdM,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: ':pdm_id',
        component: AddEditPdM,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: ':pdm_id/arquivos/novo',
        component: ListPdM,
        props: {
          type: 'novo',
          group: 'arquivos',
          submenu: SubmenuConfig,
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/macrotemas/novo',
        component: ListPdM,
        props: {
          type: 'novo',
          group: 'macrotemas',
          submenu: SubmenuConfig,
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/macrotemas/:id',
        component: ListPdM,
        props: {
          type: 'editar',
          group: 'macrotemas',
          submenu: SubmenuConfig,
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/subtemas/novo',
        component: ListPdM,
        props: {
          type: 'novo',
          group: 'subtemas',
          submenu: SubmenuConfig,
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/subtemas/:id',
        component: ListPdM,
        props: {
          type: 'editar',
          group: 'subtemas',
          submenu: SubmenuConfig,
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/temas/novo',
        component: ListPdM,
        props: {
          type: 'novo',
          group: 'temas',
          submenu: SubmenuConfig,
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/temas/:id',
        component: ListPdM,
        props: {
          type: 'editar',
          group: 'temas',
          submenu: SubmenuConfig,
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/tags/novo',
        component: ListPdM,
        props: {
          type: 'novo',
          group: 'tags',
          submenu: SubmenuConfig,
          parentPage: 'pdm',
        },
      },
      {
        path: ':pdm_id/tags/:id',
        component: ListPdM,
        props: {
          type: 'editar',
          group: 'tags',
          submenu: SubmenuConfig,
          parentPage: 'pdm',
        },
      },
    ],
  },
  {
    path: '/paineis',
    children: [
      {
        path: '',
        component: ListPainel,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo',
        component: AddEditPainel,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: ':painel_id',
        component: AddEditPainel,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: ':painel_id/metas',
        component: AddEditPainel,
        props: {
          type: 'selecionarMetas',
          submenu: SubmenuConfig,
        },
      },
      {
        path: ':painel_id/metas/:conteudo_id',
        component: AddEditPainel,
        props: {
          type: 'editarMeta',
          submenu: SubmenuConfig,
        },
      },
      {
        path: ':painel_id/metas/:conteudo_id/detalhes',
        component: AddEditPainel,
        props: {
          type: 'editarDetalhe',
          submenu: SubmenuConfig,
        },
      },
    ],
  },
  {
    path: '/paineis-grupos',
    children: [
      {
        path: '',
        component: ListGrupos,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo',
        component: AddEditGrupo,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: ':grupo_id',
        component: AddEditGrupo,
        props: {
          submenu: SubmenuConfig,
        },
      },
    ],
  },
  {
    path: '/regioes',
    children: [
      {
        path: '',
        component: ListRegions,
        props: {
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo',
        component: ListRegions,
        props: {
          type: 'novo',
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo/:id',
        component: ListRegions,
        props: {
          type: 'novo',
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo/:id/:id2',
        component: ListRegions,
        props: {
          type: 'novo',
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'novo/:id/:id2/:id3',
        component: ListRegions,
        props: {
          type: 'novo',
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'editar/:id',
        component: ListRegions,
        props: {
          type: 'editar',
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'editar/:id/:id2',
        component: ListRegions,
        props: {
          type: 'editar',
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'editar/:id/:id2/:id3',
        component: ListRegions,
        props: {
          type: 'editar',
          submenu: SubmenuConfig,
        },
      },
      {
        path: 'editar/:id/:id2/:id3/:id4',
        component: ListRegions,
        props: {
          type: 'editar',
          submenu: SubmenuConfig,
        },
      },
    ],
  },
  {
    path: '/portfolios',
    name: 'portfolios',
    meta: {
      requerAutenticação: true,
      title: 'Portfolios',
    },
    props: {
      submenu: SubmenuConfig,
    },

    children: [
      {
        path: '',
        component: PortfoliosLista,
        meta: {
          título: 'Portfolios',
        },
      },
    ],
  },
];
