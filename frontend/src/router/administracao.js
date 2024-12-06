import { defineAsyncComponent } from 'vue';

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
      'gerenciarÓrgãos',
      'gerenciarUnidadesDeMedida',
      'gerenciarTiposDeDocumento',
      'gerenciarCategorias',
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
      'categoriaAssuntosListar',
      'assuntosListar',
      'modalidadesListar',
      'fontesListar',
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
        'CadastroPessoa.',
        'CadastroOrgao.',
        'CadastroUnidadeMedida.',
        'CadastroTipoDocumento.',
        'CadastroOds.',
        'CadastroPdm.',
        'CadastroRegiao.',
        'Projeto.administrar_portfolios',
        'CadastroPainelExterno.',
        'CadastroProjetoEtapa.',
      ],
      presenteNoMenu: true,
      pesoNoMenu: Infinity,
      título: 'Administração',
      íconeParaMenu: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M18 12V11.2V8.8V8.001H3.6L2 8V12H18ZM18 6V5.2V2.8V2.001H3.6L2 2V6H18ZM2 0H17.99C19.33 0 20 0.668 20 2V17.92C20 19.307 19.333 20 18 20H2C0.667 20 0 19.307 0 17.92V2C0 0.667 0.667 0 2 0ZM3.6 14H2V18H18V17.2V14.8V14.001H3.6V14ZM4 5C3.73478 5 3.48043 4.89464 3.29289 4.70711C3.10536 4.51957 3 4.26522 3 4C3 3.73478 3.10536 3.48043 3.29289 3.29289C3.48043 3.10536 3.73478 3 4 3C4.26522 3 4.51957 3.10536 4.70711 3.29289C4.89464 3.48043 5 3.73478 5 4C5 4.26522 4.89464 4.51957 4.70711 4.70711C4.51957 4.89464 4.26522 5 4 5ZM4 11C3.73478 11 3.48043 10.8946 3.29289 10.7071C3.10536 10.5196 3 10.2652 3 10C3 9.73478 3.10536 9.48043 3.29289 9.29289C3.48043 9.10536 3.73478 9 4 9C4.26522 9 4.51957 9.10536 4.70711 9.29289C4.89464 9.48043 5 9.73478 5 10C5 10.2652 4.89464 10.5196 4.70711 10.7071C4.51957 10.8946 4.26522 11 4 11ZM4 17C3.73478 17 3.48043 16.8946 3.29289 16.7071C3.10536 16.5196 3 16.2652 3 16C3 15.7348 3.10536 15.4804 3.29289 15.2929C3.48043 15.1054 3.73478 15 4 15C4.26522 15 4.51957 15.1054 4.70711 15.2929C4.89464 15.4804 5 15.7348 5 16C5 16.2652 4.89464 16.5196 4.70711 16.7071C4.51957 16.8946 4.26522 17 4 17Z" />
</svg>`,
      rotasParaMenuSecundário,
      rotasParaMenuPrincipal: [
        'gerenciarUsuários',
        'cadastrosBasicos',
      ],
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
              ...{ partidoId: Number.parseInt(params.partidoId, 10) || undefined },
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
          limitarÀsPermissões: [
            'ProjetoMDO.administrador',
          ],
        },
        children: [
          {
            name: 'gruposTematicosObras',
            path: '',
            component: GruposTematicosLista,
            meta: {
              título: 'Grupos temáticos',
              rotasParaMigalhasDePão: [
                'cadastrosBasicos',
              ],
            },
          },
          {
            name: 'grupoTematicoCriar',
            path: 'novo',
            component: GruposTematicosCriarEditar,
            meta: {
              título: 'Novo grupo temático',
              rotasParaMigalhasDePão: [
                'cadastrosBasicos',
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
              ...{ grupoTematicoId: Number.parseInt(params.grupoTematicoId, 10) || undefined },
            }),
            meta: {
              título: 'Editar',
              rotasParaMigalhasDePão: [
                'cadastrosBasicos',
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
          limitarÀsPermissões: [
            'ProjetoMDO.administrador',
          ],
        },
        children: [
          {
            name: 'tiposDeIntervencao',
            path: '',
            component: TiposDeIntervencaoLista,
            meta: {
              título: 'Tipos de intervenção',
              rotasParaMigalhasDePão: [
                'cadastrosBasicos',
              ],
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
              ...{ intervencaoId: Number.parseInt(params.intervencaoId, 10) || undefined },
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
          limitarÀsPermissões: [
            'ProjetoMDO.administrador',
          ],
        },
        children: [
          {
            name: 'equipamentosLista',
            path: '',
            component: EquipamentosLista,
            meta: {
              título: 'Equipamentos',
              rotasParaMigalhasDePão: [
                'cadastrosBasicos',
              ],
            },
          },
          {
            name: 'equipamentosCriar',
            path: 'novo',
            component: EquipamentosCriarEditar,
            meta: {
              título: 'Novo equipamento',
              rotasParaMigalhasDePão: [
                'cadastrosBasicos',
                'equipamentosLista',
              ],
            },
          },
          {
            path: ':equipamentoId',
            name: 'equipamentoEditar',
            component: EquipamentosCriarEditar,
            props: ({ params }) => ({
              ...params,
              ...{ equipamentoId: Number.parseInt(params.equipamentoId, 10) || undefined },
            }),
            meta: {
              título: 'Editar equipamento',
              rotasParaMigalhasDePão: [
                'cadastrosBasicos',
                'equipamentosLista',
              ],
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
              ...{ bancadaId: Number.parseInt(params.bancadaId, 10) || undefined },
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
                tipoDeAtendimentoId: Number.parseInt(params.tipoDeAtendimentoId, 10) || undefined,
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
          limitarÀsPermissões: 'CadastroTransferencia.listar',
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
      limitarÀsPermissões: 'CadastroUnidadeMedida.',
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
      limitarÀsPermissões: 'CadastroTipoDocumento.',
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
      limitarÀsPermissões: 'CadastroOds.',
      título: 'Categorias',
      rotasParaMenuSecundário,
      entidadeMãe: 'pdm',
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
          rotasParaMigalhasDePão: [
            'tipoDeAditivosListar',
          ],
        },
      },
      {
        path: ':aditivoId',
        component: () => import('@/views/tipoDeAditivo/AditivosCriarEditar.vue'),
        name: 'tipoDeAditivosEditar',
        meta: {
          título: 'Editar tipo de aditivo',
          rotasParaMigalhasDePão: [
            'tipoDeAditivosListar',
          ],
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
        component: () => import('@/views/variaveisCategoricas/VariaveisCategoricasCriarEditar.vue'),
        meta: {
          título: 'Novo tipo de variável categórica',
          rotasParaMigalhasDePão: [
            'variaveisCategoricasListar',
          ],
        },
      },
      {
        path: ':variavelId',
        name: 'variaveisCategoricasEditar',
        component: () => import('@/views/variaveisCategoricas/VariaveisCategoricasCriarEditar.vue'),
        props: ({ params }) => ({
          ...params,
          ...{ variavelId: Number.parseInt(params.variavelId, 10) || undefined },
        }),

        meta: {
          título: 'Editar tipo de variável categórica',
          rotasParaMigalhasDePão: [
            'variaveisCategoricasListar',
          ],
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
        name: 'categoriaAssuntosListar',
        path: '',
        component: () => import('@/views/ps.categoriaAssunto/CategoriaAssuntoLista.vue'),
        meta: {
          título: 'Categoria de Assuntos',
        },
      },
      {
        name: 'categoriaAssuntosCriar',
        path: 'novo',
        component: () => import('@/views/ps.categoriaAssunto/CategoriaAssuntoCriarEditar.vue'),
        meta: {
          título: 'Nova categoria de assunto',
          rotasParaMigalhasDePão: [
            'categoriaAssuntosListar',
          ],
        },
      },
      {
        name: 'categoriaAssuntosEditar',
        path: ':categoriaAssuntoId',
        component: () => import('@/views/ps.categoriaAssunto/CategoriaAssuntoCriarEditar.vue'),
        props: ({ params }) => ({
          ...params,
          ...{ categoriaAssuntoId: Number.parseInt(params.categoriaAssuntoId, 10) || undefined },
        }),

        meta: {
          título: 'Editar categoria de assunto',
          rotasParaMigalhasDePão: [
            'categoriaAssuntosListar',
          ],
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
        name: 'assuntosListar',
        path: '',
        component: () => import('@/views/ps.assuntos/AssuntosLista.vue'),
        meta: {
          título: 'Assuntos',
        },
      },
      {
        name: 'assuntosCriar',
        path: 'novo',
        component: () => import('@/views/ps.assuntos/AssuntosCriarEditar.vue'),
        meta: {
          título: 'Novo assunto',
          rotasParaMigalhasDePão: [
            'assuntosListar',
          ],
        },
      },
      {
        path: ':assuntoId',
        name: 'assuntosEditar',
        component: () => import('@/views/ps.assuntos/AssuntosCriarEditar.vue'),
        props: ({ params }) => ({
          ...params,
          ...{ assuntoId: Number.parseInt(params.assuntoId, 10) || undefined },
        }),

        meta: {
          título: 'Editar assunto',
          rotasParaMigalhasDePão: [
            'assuntosListar',
          ],
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
        name: 'fontesListar',
        path: '',
        component: () => import('@/views/ps.fontes/FontesLista.vue'),
        meta: {
          título: 'Fontes',
        },
      },
      {
        name: 'fontesCriar',
        path: 'novo',
        component: () => import('@/views/ps.fontes/FontesCriarEditar.vue'),
        meta: {
          título: 'Nova fonte',
          rotasParaMigalhasDePão: [
            'fontesListar',
          ],
        },
      },
      {
        path: ':fonteId',
        name: 'fontesEditar',
        component: () => import('@/views/ps.fontes/FontesCriarEditar.vue'),
        props: ({ params }) => ({
          ...params,
          ...{ fonteId: Number.parseInt(params.fonteId, 10) || undefined },
        }),

        meta: {
          título: 'Editar fonte',
          rotasParaMigalhasDePão: [
            'fontesListar',
          ],
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
          rotasParaMigalhasDePão: [
            'modalidadesListar',
          ],
        },
      },
      {
        path: ':modalidadeId',
        name: 'modalidadesEditar',
        component: () => import('@/views/modalidadeDeContratacao/ModalidadesCriarEditar.vue'),
        props: ({ params }) => ({
          ...params,
          ...{ modalidadeId: Number.parseInt(params.modalidadeId, 10) || undefined },
        }),

        meta: {
          título: 'Editar modalidade',
          rotasParaMigalhasDePão: [
            'modalidadesListar',
          ],
        },
      },
    ],
  },
];
