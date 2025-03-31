import { defineAsyncComponent } from 'vue';
// eslint-disable-next-line import/no-cycle
import {
  useODSStore,
  useOrgansStore,
  useResourcesStore,
  useDocumentTypesStore,
} from '@/stores';
import { useFontesStore } from '@/stores/fontesPs.store';
import { useAssuntosStore } from '@/stores/assuntosPs.store';

import LoadingComponent from '@/components/LoadingComponent.vue';
import { Administracao } from '@/views';
import CadastrosBasicosRaiz from '@/views/CadastrosBasicosRaiz.vue';
import BancadasCriarEditar from '@/views/bancada/BancadasCriarEditar.vue';
import BancadasLista from '@/views/bancada/BancadasLista.vue';
import BancadasRaiz from '@/views/bancada/BancadasRaiz.vue';
import {
  AddEditDocumentTypes,
  ListDocumentTypes,
} from '@/views/documentTypes';
import EquipamentosCriarEditar from '@/views/equipamentos/EquipamentosCriarEditar.vue';
import EquipamentosLista from '@/views/equipamentos/EquipamentosLista.vue';
import EquipamentosRaiz from '@/views/equipamentos/EquipamentosRaiz.vue';
import GruposTematicosCriarEditar from '@/views/gruposTematicos/GruposTematicosCriarEditar.vue';
import GruposTematicosLista from '@/views/gruposTematicos/GruposTematicosLista.vue';
import GruposTematicosRaiz from '@/views/gruposTematicos/GruposTematicosRaiz.vue';
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
import PartidosCriarEditar from '@/views/partidos/PartidosCriarEditar.vue';
import PartidosLista from '@/views/partidos/PartidosLista.vue';
import PartidosRaiz from '@/views/partidos/PartidosRaiz.vue';
import { ListRegions } from '@/views/regions';
import {
  AddEditResources,
  ListResources,
} from '@/views/resources';
import TiposDeIntervencaoCriarEditar from '@/views/tiposDeIntervencao/TiposDeIntervencaoCriarEditar.vue';
import TiposDeIntervencaoLista from '@/views/tiposDeIntervencao/TiposDeIntervencaoLista.vue';
import TiposDeIntervencaoRaiz from '@/views/tiposDeIntervencao/TiposDeIntervencaoRaiz.vue';
import {
  AddEditUsers,
  ListUsers,
} from '@/views/users';

import TipoDeTransferenciaCriarEditar from '@/views/tipoDeTransferencia/TipoDeTransferenciaCriarEditar.vue';
import TipoDeTransferenciaLista from '@/views/tipoDeTransferencia/TipoDeTransferenciaLista.vue';
import TipoDeTransferenciaRaiz from '@/views/tipoDeTransferencia/TipoDeTransferenciaRaiz.vue';

import EtapasCriarEditar from '@/views/etapasProjeto/EtapasCriarEditar.vue';
import EtapasLista from '@/views/etapasProjeto/EtapasLista.vue';
import EtapasRaiz from '@/views/etapasProjeto/EtapasRaiz.vue';

import ClassificacaoCriarEditar from '@/views/classificacao/ClassificacaoCriarEditar.vue';
import ClassificacaoLista from '@/views/classificacao/ClassificacaoLista.vue';
import ClassificacaoRaiz from '@/views/classificacao/ClassificacaoRaiz.vue';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useModalidadeDeContratacaoStore } from '@/stores/modalidadeDeContratacao.store';

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
      'tipoDeAcompanhamentoListar',
      'orgaos.listar',
      'orgaos.tipos',
      'tipoDocumento.listar',
      'unidadeMedida.lista',
      'categorias.lista',
      'classificacao',
      'gerenciarRegiões',
      'tipoDeTransferenciaListar',
      'mdo.etapasListar',
      'projeto.etapasListar',
      'gruposTematicosObras',
      'tiposDeIntervencao',
      'equipamentosLista',
      'tipoDeAditivosListar',
      'variaveisCategoricasListar',
      'categoriaAssunto.listar',
      'assunto.listar',
      'modalidadesListar',
      'fonte.listar',
      'partidosListar',
    ],
  },
];

export default [
  {
    path: '/administracao',
    component: Administracao,
    meta: {
      limitarÀsPermissões: [
        'CadastroEquipamentoMDO.',
        'CadastroProjetoEtapaMDO.',
        'GrupoTematicoMDO.',
        'ModalidadeContratacao.',
        'TipoAditivo.',
        'TipoIntervecaoMDO.',
        'CadastroOds.',
        'CadastroOrgao.',
        'CadastroPainelExterno.',
        'CadastroPdm.',
        'CadastroPessoa.',
        'CadastroProjetoEtapa.',
        'CadastroRegiao.',
        'CadastroTipoDocumento.',
        'CadastroUnidadeMedida.',
        'Projeto.administrar_portfolios',
      ],
      presenteNoMenu: true,
      pesoNoMenu: Infinity,
      título: 'Administração',
      íconeParaMenu: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M18 12V11.2V8.8V8.001H3.6L2 8V12H18ZM18 6V5.2V2.8V2.001H3.6L2 2V6H18ZM2 0H17.99C19.33 0 20 0.668 20 2V17.92C20 19.307 19.333 20 18 20H2C0.667 20 0 19.307 0 17.92V2C0 0.667 0.667 0 2 0ZM3.6 14H2V18H18V17.2V14.8V14.001H3.6V14ZM4 5C3.73478 5 3.48043 4.89464 3.29289 4.70711C3.10536 4.51957 3 4.26522 3 4C3 3.73478 3.10536 3.48043 3.29289 3.29289C3.48043 3.10536 3.73478 3 4 3C4.26522 3 4.51957 3.10536 4.70711 3.29289C4.89464 3.48043 5 3.73478 5 4C5 4.26522 4.89464 4.51957 4.70711 4.70711C4.51957 4.89464 4.26522 5 4 5ZM4 11C3.73478 11 3.48043 10.8946 3.29289 10.7071C3.10536 10.5196 3 10.2652 3 10C3 9.73478 3.10536 9.48043 3.29289 9.29289C3.48043 9.10536 3.73478 9 4 9C4.26522 9 4.51957 9.10536 4.70711 9.29289C4.89464 9.48043 5 9.73478 5 10C5 10.2652 4.89464 10.5196 4.70711 10.7071C4.51957 10.8946 4.26522 11 4 11ZM4 17C3.73478 17 3.48043 16.8946 3.29289 16.7071C3.10536 16.5196 3 16.2652 3 16C3 15.7348 3.10536 15.4804 3.29289 15.2929C3.48043 15.1054 3.73478 15 4 15C4.26522 15 4.51957 15.1054 4.70711 15.2929C4.89464 15.4804 5 15.7348 5 16C5 16.2652 4.89464 16.5196 4.70711 16.7071C4.51957 16.8946 4.26522 17 4 17Z" />
</svg>`,
      rotasParaMenuSecundário,
      rotasParaMenuPrincipal: ['gerenciarUsuários', 'cadastrosBasicos'],
    },

    children: [
      {
        path: 'partidos',
        component: PartidosRaiz,
        meta: {
          título: 'Partidos',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário,
          limitarÀsPermissões: 'CadastroPartido.',
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
              ...{
                partidoId: Number.parseInt(params.partidoId, 10) || undefined,
              },
            }),

            meta: {
              título: 'Editar partido',
            },
          },
        ],
      },
      {
        path: 'grupos-tematicos',
        component: GruposTematicosRaiz,
        meta: {
          título: 'Grupos temáticos',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário,
          limitarÀsPermissões: ['GrupoTematicoMDO.'],
        },
        children: [
          {
            name: 'gruposTematicosObras',
            path: '',
            component: GruposTematicosLista,
            meta: {
              título: 'Grupos temáticos',
            },
          },
          {
            name: 'grupoTematicoCriar',
            path: 'novo',
            component: GruposTematicosCriarEditar,
            meta: {
              título: 'Novo grupo temático',
              rotasParaMigalhasDePão: [
                'gruposTematicosObras',
              ],
            },
          },
          {
            path: ':grupoTematicoId',
            name: 'grupoTematicoEditar',
            component: GruposTematicosCriarEditar,
            props: ({ params }) => ({
              ...params,
              ...{
                grupoTematicoId:
                  Number.parseInt(params.grupoTematicoId, 10) || undefined,
              },
            }),
            meta: {
              título: () => useGruposTematicosStore()?.emFoco?.nome || 'Editar Grupo Temático',
              rotasParaMigalhasDePão: [
                'gruposTematicosObras',
              ],
            },
          },
        ],
      },
      {
        path: 'tipo-intervencao',
        component: TiposDeIntervencaoRaiz,
        meta: {
          título: 'Tipos de intervenção',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário,
          limitarÀsPermissões: ['TipoIntervecaoMDO.'],
        },
        children: [
          {
            name: 'tiposDeIntervencao',
            path: '',
            component: TiposDeIntervencaoLista,
            meta: {
              título: 'Tipos de intervenção',
              rotasParaMigalhasDePão: ['cadastrosBasicos'],
            },
          },
          {
            name: 'tiposDeIntervencaoCriar',
            path: 'novo',
            component: TiposDeIntervencaoCriarEditar,
            meta: {
              título: 'Novo',
              rotasParaMigalhasDePão: [
                'cadastrosBasicos',
                'tiposDeIntervencao',
              ],
            },
          },
          {
            path: ':intervencaoId',
            name: 'tiposDeIntervencaoEditar',
            component: TiposDeIntervencaoCriarEditar,
            props: ({ params }) => ({
              ...params,
              ...{
                intervencaoId:
                  Number.parseInt(params.intervencaoId, 10) || undefined,
              },
            }),
            meta: {
              título: 'Editar',
              rotasParaMigalhasDePão: [
                'cadastrosBasicos',
                'tiposDeIntervencao',
              ],
            },
          },
        ],
      },
      {
        path: 'equipamentos',
        component: EquipamentosRaiz,
        meta: {
          título: 'Equipamentos',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário,
          limitarÀsPermissões: ['CadastroEquipamentoMDO.'],
        },
        children: [
          {
            name: 'equipamentosLista',
            path: '',
            component: EquipamentosLista,
            meta: {
              título: 'Equipamentos',
              rotasParaMigalhasDePão: ['cadastrosBasicos'],
            },
          },
          {
            name: 'equipamentosCriar',
            path: 'novo',
            component: EquipamentosCriarEditar,
            meta: {
              título: 'Novo equipamento',
              rotasParaMigalhasDePão: ['cadastrosBasicos', 'equipamentosLista'],
            },
          },
          {
            path: ':equipamentoId',
            name: 'equipamentoEditar',
            component: EquipamentosCriarEditar,
            props: ({ params }) => ({
              ...params,
              ...{
                equipamentoId:
                  Number.parseInt(params.equipamentoId, 10) || undefined,
              },
            }),
            meta: {
              título: 'Editar equipamento',
              rotasParaMigalhasDePão: ['cadastrosBasicos', 'equipamentosLista'],
            },
          },
        ],
      },
      {
        path: 'bancadas',
        component: BancadasRaiz,
        meta: {
          title: 'Bancadas',
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: 'CadastroBancada.',
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
              ...{
                bancadaId: Number.parseInt(params.bancadaId, 10) || undefined,
              },
            }),

            meta: {
              título: 'Editar bancada',
            },
          },
        ],
      },
      {
        path: 'tipos-de-acompanhamento',
        component: TiposDeAcompanhamentoRaiz,
        meta: {
          título: 'Tipos de acompanhamento',
          presenteNoMenu: true,
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: 'Projeto.administrar_portfolios',
          rotasParaMenuSecundário,
          entidadeMãe: 'projeto',
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
              ...{
                tipoDeAtendimentoId:
                  Number.parseInt(params.tipoDeAtendimentoId, 10) || undefined,
              },
            }),

            meta: {
              título: 'Editar tipo de acompanhamento',
              rotaDeEscape: 'tipoDeAcompanhamentoListar',
            },
          },
        ],
      },
      {
        path: '/transferencia-tipo',
        component: TipoDeTransferenciaRaiz,
        meta: {
          título: 'Tipo de Transferência',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário,
          limitarÀsPermissões: ['CadastroTransferenciaTipo.'],
        },
        children: [
          {
            name: 'tipoDeTransferenciaListar',
            path: '',
            component: TipoDeTransferenciaLista,
            meta: {
              título: 'Tipo de Transferência',
            },
          },
          {
            name: 'tipoDeTransferenciaCriar',
            path: 'novo',
            component: TipoDeTransferenciaCriarEditar,
            meta: {
              título: 'Novo Tipo de Transferência',
            },
          },
          {
            path: ':tipoId',
            name: 'tipoDeTransferenciaEditar',
            component: TipoDeTransferenciaCriarEditar,
            props: ({ params }) => ({
              ...params,
              ...{ tipoId: Number.parseInt(params.tipoId, 10) || undefined },
            }),

            meta: {
              título: 'Editar Tipo de Transferência',
            },
          },
        ],
      },
      {
        path: 'etapa-de-obra',
        component: EtapasRaiz,
        meta: {
          título: 'Etapas de obra',
          entidadeMãe: 'mdo',
          presenteNoMenu: true,
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: 'CadastroProjetoEtapaMDO.',
          rotasParaMenuSecundário,
        },
        props: true,
        children: [
          {
            name: 'mdo.etapasListar',
            path: '',
            component: EtapasLista,
            meta: {
              título: 'Etapas da obra',
            },
          },
          {
            name: 'mdo.etapaCriar',
            path: 'novo',
            component: EtapasCriarEditar,
            meta: {
              título: 'Nova etapa da obra',
              rotaDeEscape: 'mdo.etapasListar',
            },
          },
          {
            path: ':etapaId',
            name: 'mdo.etapaEditar',
            component: EtapasCriarEditar,
            props: ({ params }) => ({
              ...params,
              ...{
                etapaId: Number.parseInt(params.etapaId, 10) || undefined,
              },
            }),
            meta: {
              título: 'Editar etapa da obra',
              rotaDeEscape: 'mdo.etapasListar',
            },
          },
        ],
      },
      {
        path: 'etapa-de-projeto',
        component: EtapasRaiz,
        meta: {
          título: 'Etapas de projeto',
          entidadeMãe: 'projeto',
          presenteNoMenu: true,
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: 'CadastroProjetoEtapa.',
          rotasParaMenuSecundário,
        },

        children: [
          {
            name: 'projeto.etapasListar',
            path: '',
            component: EtapasLista,
            meta: {
              título: 'Etapas do projeto',
            },
          },
          {
            name: 'projeto.etapaCriar',
            path: 'novo',
            component: EtapasCriarEditar,
            meta: {
              título: 'Nova etapa do projeto',
              rotaDeEscape: 'projeto.etapasListar',
            },
          },
          {
            path: ':etapaId',
            name: 'projeto.etapaEditar',
            component: EtapasCriarEditar,
            props: ({ params }) => ({
              ...params,
              ...{
                etapaId: Number.parseInt(params.etapaId, 10) || undefined,
              },
            }),

            meta: {
              título: 'Editar etapa do projeto',
              rotaDeEscape: 'projeto.etapasListar',
            },
          },
        ],
      },
    ],
  },

  {
    path: '/cadastros-basicos',
    name: 'cadastrosBasicos',
    component: CadastrosBasicosRaiz,
    meta: {
      título: 'Cadastros básicos',
      rotasParaMenuSecundário,
    },
  },

  {
    path: '/usuarios',
    component: () => import('@/views/users/UsuariosRaiz.vue'),
    meta: {
      limitarÀsPermissões: 'CadastroPessoa.',
      título: 'Gerenciar usuários',
      rotasParaMenuSecundário: [
        // PRA-FAZER: adicionar edição de responsabilidade
      ],
    },
    children: [
      {
        name: 'gerenciarUsuários',
        path: '',
        component: ListUsers,
      },
      {
        path: 'novo',
        name: 'criarUsuários',
        component: AddEditUsers,
        meta: {
          título: 'Cadastro de Usuário',
          rotaDeEscape: 'gerenciarUsuários',
        },
      },
      {
        path: 'editar/:id',
        name: 'editarUsuários',
        component: AddEditUsers,
        meta: {
          rotaDeEscape: 'gerenciarUsuários',
        },
      },
    ],
  },
  {
    path: '/orgaos',
    meta: {
      limitarÀsPermissões: 'CadastroOrgao.',
      título: 'Órgãos',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'orgaos.listar',
        path: '',
        component: ListOrgans,
      },
      {
        path: 'novo',
        name: 'orgaos.novo',
        meta: {
          título: 'Novo Órgão',
          rotasParaMigalhasDePão: ['orgaos.listar'],
          rotaDeEscape: 'orgaos.listar',
        },
        component: AddEditOrgans,
      },
      {
        path: 'editar/:id',
        name: 'orgaos.editar',
        meta: {
          título: () => useOrgansStore().tempOrgans.descricao,
          rotasParaMigalhasDePão: ['orgaos.listar'],
          rotaDeEscape: 'orgaos.listar',
        },
        component: AddEditOrgans,
      },
      {
        path: 'tipos',
        meta: {
          título: 'Tipos de Orgão',
        },
        children: [
          {
            path: '',
            name: 'orgaos.tipos',
            component: ListOrganTypes,
          },
          {
            path: 'novo',
            component: AddEditOrganTypes,
            name: 'orgaos.tipos.novo',
            meta: {
              título: 'Novo Tipo de Orgão',
              rotasParaMigalhasDePão: ['orgaos.tipos'],
            },
          },
          {
            path: 'editar/:id',
            component: AddEditOrganTypes,
            name: 'orgaos.tipos.editar',
            meta: {
              título: 'Editar tipo de Orgão',
              rotasParaMigalhasDePão: ['orgaos.tipos'],
            },
          },
        ],
      },
    ],
  },
  {
    path: '/unidade-medida',
    meta: {
      limitarÀsPermissões: 'CadastroUnidadeMedida.',
      título: 'Unidades de Medida',
      rotasParaMenuSecundário,
    },
    children: [
      {
        path: '',
        name: 'unidadeMedida.lista',
        component: ListResources,
      },
      {
        path: 'novo',
        name: 'unidadeMedida.novo',
        component: AddEditResources,
        meta: {
          título: 'Nova Unidade de Medida',
          rotaDeEscape: 'unidadeMedida.lista',
          rotasParaMigalhasDePão: ['unidadeMedida.lista'],
        },
      },
      {
        path: 'editar/:id',
        name: 'unidadeMedida.editar',
        component: AddEditResources,
        meta: {
          título: () => useResourcesStore().tempResources.descricao,
          rotaDeEscape: 'unidadeMedida.lista',
          rotasParaMigalhasDePão: ['unidadeMedida.lista'],
        },
      },
    ],
  },
  {
    path: '/tipo-documento',
    meta: {
      limitarÀsPermissões: 'CadastroTipoDocumento.',
      título: 'Tipos de Documento',
      rotasParaMenuSecundário,
    },
    children: [
      {
        path: '',
        name: 'tipoDocumento.listar',
        component: ListDocumentTypes,
      },
      {
        path: 'novo',
        name: 'tipoDocumento.novo',
        component: AddEditDocumentTypes,
        meta: {
          título: 'Novo Tipo de Documento',
          rotasParaMigalhasDePão: ['tipoDocumento.listar'],
          rotaDeEscape: 'tipoDocumento.listar',
        },
      },
      {
        path: 'editar/:id',
        name: 'tipoDocumento.editar',
        component: AddEditDocumentTypes,
        meta: {
          título: () => useDocumentTypesStore().tempDocumentTypes.descricao,
          rotasParaMigalhasDePão: ['tipoDocumento.listar'],
          rotaDeEscape: 'tipoDocumento.listar',
        },
      },
    ],
  },
  {
    path: '/categorias',
    meta: {
      limitarÀsPermissões: 'CadastroOds.',
      título: 'Categorias de Tags',
      rotasParaMenuSecundário,
      entidadeMãe: 'pdm',
    },
    children: [
      {
        path: '',
        name: 'categorias.lista',
        component: ListODS,
      },
      {
        path: 'nova',
        name: 'categorias.novo',
        component: AddEditODS,
        meta: {
          título: 'Nova Categoria de Tags',
          rotaDeEscape: 'categorias.lista',
          rotasParaMigalhasDePão: ['categorias.lista'],
        },
      },
      {
        path: 'editar/:id',
        name: 'categorias.editar',
        component: AddEditODS,
        meta: {
          título: () => useODSStore().tempODS.titulo,
          rotaDeEscape: 'categorias.lista',
          rotasParaMigalhasDePão: ['categorias.lista'],
        },
      },
    ],
  },
  {
    path: '/classificacao',
    meta: {
      título: 'Classificação',
      rotasParaMenuSecundário,
      limitarÀsPermissões: 'CadastroClassificacao.',
    },
    component: ClassificacaoRaiz,
    children: [
      {
        name: 'classificacao',
        path: '',
        component: ClassificacaoLista,
      },
      {
        name: 'classificacao.novo',
        path: 'novo',
        component: ClassificacaoCriarEditar,
      },
      {
        name: 'classificacao.editar',
        path: ':classificacaoId',
        component: ClassificacaoCriarEditar,
      },
    ],
  },

  {
    path: '/regioes',
    meta: {
      limitarÀsPermissões: 'CadastroRegiao.',
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
        name: 'novaRegião',
        props: {
          type: 'novo',
        },
      },
      {
        path: 'novo/:id',
        component: ListRegions,
        name: 'novaRegião1',
        props: {
          type: 'novo',
        },
      },
      {
        path: 'novo/:id/:id2',
        component: ListRegions,
        name: 'novaRegião2',
        props: {
          type: 'novo',
        },
      },
      {
        path: 'novo/:id/:id2/:id3',
        component: ListRegions,
        name: 'novaRegião3',
        props: {
          type: 'novo',
        },
      },
      {
        path: 'editar/:id',
        component: ListRegions,
        name: 'editarRegião',
        props: {
          type: 'editar',
        },
      },
      {
        path: 'editar/:id/:id2',
        component: ListRegions,
        name: 'editarRegião2',
        props: {
          type: 'editar',
        },
      },
      {
        path: 'editar/:id/:id2/:id3',
        component: ListRegions,
        name: 'editarRegião3',
        props: {
          type: 'editar',
        },
      },
      {
        path: 'editar/:id/:id2/:id3/:id4',
        component: ListRegions,
        name: 'editarRegião4',
        props: {
          type: 'editar',
        },
      },
    ],
  },

  {
    path: '/tipo-de-aditivos',
    component: () => import('@/views/tipoDeAditivo/AditivosRaiz.vue'),
    meta: {
      limitarÀsPermissões: 'TipoAditivo.',
      título: 'Tipo de aditivos',
      rotasParaMenuSecundário,
    },
    children: [
      {
        path: '',
        name: 'tipoDeAditivosListar',
        component: () => import('@/views/tipoDeAditivo/AditivosLista.vue'),
      },
      {
        path: 'novo',
        component: () => import('@/views/tipoDeAditivo/AditivosCriarEditar.vue'),
        name: 'tipoDeAditivosCriar',
        meta: {
          título: 'Novo tipo de aditivo',
          rotasParaMigalhasDePão: ['tipoDeAditivosListar'],
        },
      },
      {
        path: ':aditivoId',
        component: () => import('@/views/tipoDeAditivo/AditivosCriarEditar.vue'),
        name: 'tipoDeAditivosEditar',
        meta: {
          título: 'Editar tipo de aditivo',
          rotasParaMigalhasDePão: ['tipoDeAditivosListar'],
        },
      },
    ],
  },
  {
    path: '/variaveis-categoricas',
    component: () => import('@/views/variaveisCategoricas/VariaveisCategoricasRaiz.vue'),
    meta: {
      limitarÀsPermissões: 'CadastroVariavelCategorica.',
      título: 'Tipos de variáveis categóricas',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'variaveisCategoricasListar',
        path: '',
        component: () => import('@/views/variaveisCategoricas/VariaveisCategoricasLista.vue'),
        meta: {
          título: 'Tipos de variáveis categóricas',
        },
      },
      {
        name: 'variaveisCategoricasCriar',
        path: 'novo',
        component: () => import(
          '@/views/variaveisCategoricas/VariaveisCategoricasCriarEditar.vue'
        ),
        meta: {
          título: 'Novo tipo de variável categórica',
          rotasParaMigalhasDePão: ['variaveisCategoricasListar'],
        },
      },
      {
        path: ':variavelId',
        name: 'variaveisCategoricasEditar',
        component: () => import(
          '@/views/variaveisCategoricas/VariaveisCategoricasCriarEditar.vue'
        ),
        props: ({ params }) => ({
          ...params,
          ...{
            variavelId: Number.parseInt(params.variavelId, 10) || undefined,
          },
        }),

        meta: {
          título: 'Editar tipo de variável categórica',
          rotasParaMigalhasDePão: ['variaveisCategoricasListar'],
        },
      },
    ],
  },
  {
    path: '/categoria-assunto',
    component: () => import('@/views/ps.categoriaAssunto/CategoriaAssuntoRaiz.vue'),
    meta: {
      limitarÀsPermissões: 'AssuntoVariavel.',
      título: 'Categoria de Assuntos',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'categoriaAssunto.listar',
        path: '',
        component: () => import('@/views/ps.categoriaAssunto/CategoriaAssuntoLista.vue'),
        meta: {
          título: 'Categoria de Assuntos',
        },
      },
      {
        name: 'categoriaAssunto.novo',
        path: 'novo',
        component: () => import('@/views/ps.categoriaAssunto/CategoriaAssuntoCriarEditar.vue'),
        meta: {
          título: 'Nova categoria de assunto',
          rotasParaMigalhasDePão: ['categoriaAssunto.listar'],
          rotaDeEscape: 'categoriaAssunto.listar',
        },
      },
      {
        name: 'categoriaAssunto.editar',
        path: ':categoriaAssuntoId',
        component: () => import('@/views/ps.categoriaAssunto/CategoriaAssuntoCriarEditar.vue'),
        props: ({ params }) => ({
          ...params,
          ...{
            categoriaAssuntoId:
              Number.parseInt(params.categoriaAssuntoId, 10) || undefined,
          },
        }),
        meta: {
          título: () => useAssuntosStore().categoriaParaEdicao.nome,
          rotasParaMigalhasDePão: ['categoriaAssunto.listar'],
          rotaDeEscape: 'categoriaAssunto.listar',
        },
      },
    ],
  },
  {
    path: '/assuntos',
    component: () => import('@/views/ps.assuntos/AssuntosRaiz.vue'),
    meta: {
      limitarÀsPermissões: 'AssuntoVariavel.',
      título: 'Assuntos',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'assunto.listar',
        path: '',
        component: () => import('@/views/ps.assuntos/AssuntosLista.vue'),
        meta: {
          título: 'Assuntos',
        },
      },
      {
        name: 'assunto.novo',
        path: 'novo',
        component: () => import('@/views/ps.assuntos/AssuntosCriarEditar.vue'),
        meta: {
          título: 'Novo assunto',
          rotasParaMigalhasDePão: ['assunto.listar'],
          rotaDeEscape: 'assunto.listar',

        },
      },
      {
        path: ':assuntoId',
        name: 'assunto.editar',
        component: () => import('@/views/ps.assuntos/AssuntosCriarEditar.vue'),
        props: ({ params }) => ({
          ...params,
          ...{ assuntoId: Number.parseInt(params.assuntoId, 10) || undefined },
        }),

        meta: {
          título: () => useAssuntosStore().itemParaEdicao.nome,
          rotasParaMigalhasDePão: ['assunto.listar'],
          rotaDeEscape: 'assunto.listar',
        },
      },
    ],
  },
  {
    path: '/fontes',
    component: () => import('@/views/ps.fontes/FontesRaiz.vue'),
    meta: {
      limitarÀsPermissões: 'FonteVariavel.',
      título: 'Fontes',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'fonte.listar',
        path: '',
        component: () => import('@/views/ps.fontes/FontesLista.vue'),
        meta: {
          título: 'Fontes',
        },
      },
      {
        name: 'fonte.novo',
        path: 'novo',
        component: () => import('@/views/ps.fontes/FontesCriarEditar.vue'),
        meta: {
          título: 'Nova fonte',
          rotasParaMigalhasDePão: ['fonte.listar'],
          rotaDeEscape: 'fonte.listar',
        },
      },
      {
        path: ':fonteId',
        name: 'fonte.editar',
        component: () => import('@/views/ps.fontes/FontesCriarEditar.vue'),
        props: ({ params }) => ({
          ...params,
          ...{ fonteId: Number.parseInt(params.fonteId, 10) || undefined },
        }),
        meta: {
          título: () => useFontesStore().itemParaEdicao.nome,
          rotasParaMigalhasDePão: ['fonte.listar'],
          rotaDeEscape: 'fonte.listar',
        },
      },
    ],
  },
  {
    path: '/modalidade-de-contratacao',
    component: () => import('@/views/modalidadeDeContratacao/ModalidadesRaiz.vue'),
    meta: {
      limitarÀsPermissões: 'ModalidadeContratacao.',
      título: 'Modalidades de contratação',
      rotasParaMenuSecundário,
    },
    children: [
      {
        name: 'modalidadesListar',
        path: '',
        component: () => import('@/views/modalidadeDeContratacao/ModalidadesLista.vue'),
        meta: {
          título: 'Modalidades de contratação',
        },
      },
      {
        name: 'modalidadesCriar',
        path: 'nova',
        component: () => import('@/views/modalidadeDeContratacao/ModalidadesCriarEditar.vue'),
        meta: {
          título: 'Nova modalidade de contratação',
          rotasParaMigalhasDePão: ['modalidadesListar'],
        },
      },
      {
        path: ':modalidadeId',
        name: 'modalidadesEditar',
        component: () => import('@/views/modalidadeDeContratacao/ModalidadesCriarEditar.vue'),
        props: ({ params }) => ({
          ...params,
          ...{
            modalidadeId: Number.parseInt(params.modalidadeId, 10) || undefined,
          },
        }),

        meta: {
          título: () => useModalidadeDeContratacaoStore()?.emFoco?.nome || 'Editar modalidade',
          rotasParaMigalhasDePão: ['modalidadesListar'],
        },
      },
    ],
  },
];
