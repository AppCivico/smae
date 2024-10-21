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

import FluxosCriarEditar from '@/views/fluxosProjeto/FluxosCriarEditar.vue';
import FluxosLista from '@/views/fluxosProjeto/FluxosLista.vue';
import FluxosRaiz from '@/views/fluxosProjeto/FluxosRaiz.vue';
import WorkflowRaiz from '@/views/workflow/WorkflowRaiz.vue';

import EtapasCriarEditar from '@/views/etapasProjeto/EtapasCriarEditar.vue';
import EtapasLista from '@/views/etapasProjeto/EtapasLista.vue';
import EtapasRaiz from '@/views/etapasProjeto/EtapasRaiz.vue';

import FasesCriarEditar from '@/views/fasesProjeto/FasesCriarEditar.vue';
import FasesLista from '@/views/fasesProjeto/FasesLista.vue';
import FasesRaiz from '@/views/fasesProjeto/FasesRaiz.vue';

import GruposDePaineisExternosCriarEditar from '@/views/gruposDePaineisExternos/GruposDePaineisExternosCriarEditar.vue';
import GruposDePaineisExternosLista from '@/views/gruposDePaineisExternos/GruposDePaineisExternosLista.vue';
import GruposDePaineisExternosRaiz from '@/views/gruposDePaineisExternos/GruposDePaineisExternosRaiz.vue';

import SituacaoCriarEditar from '@/views/situacao/SituacaoCriarEditar.vue';
import SituacaoLista from '@/views/situacao/SituacaoLista.vue';
import SituacaoRaiz from '@/views/situacao/SituacaoRaiz.vue';

import TarefasCriarEditar from '@/views/tv.tarefas/TarefasCriarEditar.vue';
import TarefasLista from '@/views/tv.tarefas/TarefasLista.vue';
import TarefasRaiz from '@/views/tv.tarefas/TarefasRaiz.vue';

import StatusDistribuicaoCriarEditar from '@/views/statusesDistribuicao/StatusDistribuicaoCriarEditar.vue';
import StatusDistribuicaoLista from '@/views/statusesDistribuicao/StatusDistribuicaoLista.vue';
import StatusDistribuicaoRaiz from '@/views/statusesDistribuicao/StatusDistribuicaoRaiz.vue';

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
      'portfoliosListar',
    ],
  },
  {
    rotas: [
      'gerenciarPainéisDeMetas',
      'gerenciarGruposDePainéisDeMetas',
    ],
  },
];

const rotasParaMenuPrincipal = [
  'gerenciarPdm',
  'portfoliosListar',
  'mdoPortfoliosListar',
  'gerenciarPainéisDeMetas',
  'mdoEtiquetasListar',
  'mdoProgramaHabitacionalListar',
  'mdoEmpreendimentosListar',
  'parlamentaresListar',
  'paineisExternosListar',
  'equipesListar',
  'Workflow',
];

export default [
  {
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
        'Projeto.administrar_portfolios_no_orgao',
        'CadastroPainelExterno.',
        'CadastroWorkflows.',
      ],
      presenteNoMenu: true,
      pesoNoMenu: 5,
      título: 'Configurações',
      íconeParaMenu:
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M16 15C17.306 15 18.418 15.835 18.83 17H20C20.2652 17 20.5196 17.1054 20.7071 17.2929C20.8946 17.4804 21 17.7348 21 18C21 18.2652 20.8946 18.5196 20.7071 18.7071C20.5196 18.8946 20.2652 19 20 19H18.83C18.6234 19.5855 18.2403 20.0926 17.7334 20.4512C17.2265 20.8099 16.6209 21.0025 16 21.0025C15.3791 21.0025 14.7735 20.8099 14.2666 20.4512C13.7597 20.0926 13.3766 19.5855 13.17 19H4C3.73478 19 3.48043 18.8946 3.29289 18.7071C3.10536 18.5196 3 18.2652 3 18C3 17.7348 3.10536 17.4804 3.29289 17.2929C3.48043 17.1054 3.73478 17 4 17H13.17C13.377 16.4149 13.7603 15.9084 14.2671 15.5502C14.774 15.1921 15.3794 14.9998 16 15ZM16 17C15.7348 17 15.4804 17.1054 15.2929 17.2929C15.1054 17.4804 15 17.7348 15 18C15 18.2652 15.1054 18.5196 15.2929 18.7071C15.4804 18.8946 15.7348 19 16 19C16.2652 19 16.5196 18.8946 16.7071 18.7071C16.8946 18.5196 17 18.2652 17 18C17 17.7348 16.8946 17.4804 16.7071 17.2929C16.5196 17.1054 16.2652 17 16 17ZM8 9C8.58899 8.99992 9.16497 9.17322 9.65613 9.49829C10.1473 9.82336 10.5319 10.2858 10.762 10.828L10.829 11H20C20.2549 11.0003 20.5 11.0979 20.6854 11.2728C20.8707 11.4478 20.9822 11.687 20.9972 11.9414C21.0121 12.1958 20.9293 12.4464 20.7657 12.6418C20.6021 12.8373 20.3701 12.9629 20.117 12.993L20 13H10.83C10.6284 13.5703 10.2592 14.0663 9.77073 14.4231C9.28229 14.7799 8.69744 14.9808 8.09285 14.9994C7.48827 15.018 6.89217 14.8534 6.38273 14.5273C5.87328 14.2012 5.47427 13.7288 5.238 13.172L5.17 13H4C3.74512 12.9997 3.49997 12.9021 3.31463 12.7272C3.1293 12.5522 3.01777 12.313 3.00283 12.0586C2.98789 11.8042 3.07067 11.5536 3.23426 11.3582C3.39786 11.1627 3.6299 11.0371 3.883 11.007L4 11H5.17C5.37701 10.4149 5.76032 9.90842 6.26715 9.55024C6.77397 9.19206 7.37938 8.99982 8 9ZM8 11C7.73478 11 7.48043 11.1054 7.29289 11.2929C7.10536 11.4804 7 11.7348 7 12C7 12.2652 7.10536 12.5196 7.29289 12.7071C7.48043 12.8946 7.73478 13 8 13C8.26522 13 8.51957 12.8946 8.70711 12.7071C8.89464 12.5196 9 12.2652 9 12C9 11.7348 8.89464 11.4804 8.70711 11.2929C8.51957 11.1054 8.26522 11 8 11ZM16 3C17.306 3 18.418 3.835 18.83 5H20C20.2652 5 20.5196 5.10536 20.7071 5.29289C20.8946 5.48043 21 5.73478 21 6C21 6.26522 20.8946 6.51957 20.7071 6.70711C20.5196 6.89464 20.2652 7 20 7H18.83C18.6234 7.58553 18.2403 8.09257 17.7334 8.45121C17.2265 8.80985 16.6209 9.00245 16 9.00245C15.3791 9.00245 14.7735 8.80985 14.2666 8.45121C13.7597 8.09257 13.3766 7.58553 13.17 7H4C3.73478 7 3.48043 6.89464 3.29289 6.70711C3.10536 6.51957 3 6.26522 3 6C3 5.73478 3.10536 5.48043 3.29289 5.29289C3.48043 5.10536 3.73478 5 4 5H13.17C13.377 4.41493 13.7603 3.90842 14.2671 3.55024C14.774 3.19206 15.3794 2.99982 16 3ZM16 5C15.7348 5 15.4804 5.10536 15.2929 5.29289C15.1054 5.48043 15 5.73478 15 6C15 6.26522 15.1054 6.51957 15.2929 6.70711C15.4804 6.89464 15.7348 7 16 7C16.2652 7 16.5196 6.89464 16.7071 6.70711C16.8946 6.51957 17 6.26522 17 6C17 5.73478 16.8946 5.48043 16.7071 5.29289C16.5196 5.10536 16.2652 5 16 5Z" fill="currentColor"/>
        </svg>`,
      rotasParaMenuPrincipal,
    },
    children: [
      // Projetos
      {
        path: 'portfolios',
        component: PortfoliosRaiz,
        meta: {
          título: 'Portfolios',
          entidadeMãe: 'projeto',
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: [
            'Projeto.administrar_portfolios',
            'Projeto.administrar_portfolios_no_orgao',
          ],
          presenteNoMenu: true,
          rotasParaMenuSecundário: [
            'portfoliosListar',
            'gruposDeObservadoresListar',
          ],
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
              título: 'Novo portfólio',
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
              título: 'Editar portfólio',
            },
          },
        ],
      },
      // MDO
      {
        path: 'mdo/portfolios',
        component: () => import('@/views/mdo.portfolios/PortfoliosRaiz.vue'),
        meta: {
          título: 'Portfolios',
          entidadeMãe: 'mdo',
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: [
            'ProjetoMDO.administrar_portfolios',
            'ProjetoMDO.administrar_portfolios_no_orgao',
          ],
          presenteNoMenu: true,
          rotasParaMenuSecundário: [
            'mdoPortfoliosListar',
          ],
        },
        children: [
          {
            name: 'mdoPortfoliosListar',
            path: '',
            component: () => import('@/views/mdo.portfolios/PortfoliosLista.vue'),
            meta: {
              título: 'Portfolios',
            },
          },
          {
            name: 'mdoPortfoliosCriar',
            path: 'novo',
            component: () => import('@/views/mdo.portfolios/PortfoliosCriarEditar.vue'),
            meta: {
              título: 'Novo portfólio',
              rotasParaMigalhasDePão: [
                'mdoPortfoliosListar',
              ],
            },
          },
          {
            path: ':portfolioId',
            name: 'mdoPortfoliosEditar',
            component: () => import('@/views/mdo.portfolios/PortfoliosCriarEditar.vue'),
            props: ({ params }) => ({
              ...params,
              ...{ portfolioId: Number.parseInt(params.portfolioId, 10) || undefined },
            }),

            meta: {
              título: 'Editar portfólio',
              rotasParaMigalhasDePão: [
                'mdoPortfoliosListar',
              ],
            },
          },
        ],
      },
      {
        path: '/paineis-externos',
        component: PaineisExternosRaiz,
        meta: {
          título: 'Painéis externos',
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: 'CadastroPainelExterno.',
          rotasParaMenuSecundário: [
            'paineisExternosListar',
            'grupospaineisExternosListar',
          ],

        },
        children: [
          {
            name: 'paineisExternosListar',
            path: '',
            component: PaineisExternosLista,
            meta: {
              título: 'Painéis externos',
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
        path: '/equipes',
        component: () => import('@/views/equipes/EquipesRaiz.vue'),
        meta: {
          título: 'Equipes',
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: 'CadastroGrupoVariavel.',
          // rotasParaMenuSecundário: [
          // ],

        },
        children: [
          {
            name: 'equipesListar',
            path: '',
            component: () => import('@/views/equipes/EquipesLista.vue'),
            meta: {
              título: 'Equipes',
            },
          },
          {
            name: 'equipesCriar',
            path: 'novo',
            component: () => import('@/views/equipes/EquipesCriarEditar.vue'),
            meta: {
              título: 'Nova Equipe',
              rotaDeEscape: 'equipesListar',
              rotasParaMigalhasDePão: [
                'equipesListar',
              ],
            },
          },
          {
            path: ':equipeId',
            name: 'equipesEditar',
            component: () => import('@/views/equipes/EquipesCriarEditar.vue'),
            props: ({ params }) => ({
              ...params,
              ...{ equipeId: Number.parseInt(params.equipeId, 10) || undefined },
            }),
            meta: {
              título: 'Editar Equipe',
              rotaDeEscape: 'equipesListar',
              rotasParaMigalhasDePão: [
                'equipesListar',
              ],
            },
          },
        ],
      },
      {
        path: 'mdo/etiquetas',
        component: () => import('@/views/mdo.etiquetas/EtiquetasRaiz.vue'),
        meta: {
          título: 'Etiquetas',
          entidadeMãe: 'mdo',
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: [
            'ProjetoTagMDO.inserir',
          ],
          presenteNoMenu: true,
          rotasParaMenuSecundário: [
            'mdoEtiquetasListar',
          ],
        },
        children: [
          {
            name: 'mdoEtiquetasListar',
            path: '',
            component: () => import('@/views/mdo.etiquetas/EtiquetasLista.vue'),
            meta: {
              título: 'Etiquetas',
            },
          },
          {
            name: 'mdoEtiquetasCriar',
            path: 'novo',
            component: () => import('@/views/mdo.etiquetas/EtiquetasCriarEditar.vue'),
            meta: {
              título: 'Nova etiqueta',
              rotasParaMigalhasDePão: [
                'mdoEtiquetasListar',
              ],
            },
          },
          {
            path: ':etiquetaId',
            name: 'mdoEtiquetasEditar',
            component: () => import('@/views/mdo.etiquetas/EtiquetasCriarEditar.vue'),
            props: ({ params }) => ({
              ...params,
              ...{ etiquetaId: Number.parseInt(params.etiquetaId, 10) || undefined },
            }),

            meta: {
              título: 'Editar etiqueta',
              rotasParaMigalhasDePão: [
                'mdoEtiquetasListar',
              ],
            },
          },
        ],
      },
      {
        path: 'empreendimento',
        component: () => import('@/views/mdo.empreendimentos/EmpreendimentosRaiz.vue'),
        meta: {
          título: 'Empreendimentos',
          entidadeMãe: 'mdo',
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: [
            'ProjetoMDO.administrador',
          ],
          rotasParaMenuSecundário: [
            'mdoEmpreendimentosListar',
          ],
          presenteNoMenu: true,
        },
        children: [
          {
            name: 'mdoEmpreendimentosListar',
            path: '',
            component: () => import('@/views/mdo.empreendimentos/EmpreendimentosLista.vue'),
          },
          {
            name: 'mdoEmpreendimentosCriar',
            path: 'novo',
            component: () => import('@/views/mdo.empreendimentos/EmpreendimentosCriarEditar.vue'),
            meta: {
              título: 'Novo empreendimento',
              rotasParaMigalhasDePão: [
                'mdoEmpreendimentosListar',
              ],
            },
          },
          {
            path: ':empreendimentoId',
            name: 'mdoEmpreendimentosEditar',
            component: () => import('@/views/mdo.empreendimentos/EmpreendimentosCriarEditar.vue'),
            props: ({ params }) => ({
              ...params,
              ...{ empreendimentoId: Number.parseInt(params.empreendimentoId, 10) || undefined },
            }),
            meta: {
              título: 'Editar empreendimento',
              rotasParaMigalhasDePão: [
                'mdoEmpreendimentosListar',
              ],
            },
          },
        ],
      },
      {
        path: 'programa-habitacional',
        component: () => import('@/views/mdo.programasHabitacionais/ProgramaHabitacionalRaiz.vue'),
        meta: {
          título: 'Programas habitacionais',
          entidadeMãe: 'mdo',
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: [
            'ProjetoProgramaMDO.',
          ],
          rotasParaMenuSecundário: [
            'mdoProgramaHabitacionalListar',
          ],
          presenteNoMenu: true,
        },
        children: [
          {
            name: 'mdoProgramaHabitacionalListar',
            path: '',
            component: () => import('@/views/mdo.programasHabitacionais/ProgramaHabitacionalLista.vue'),
          },
          {
            name: 'mdoProgramaHabitacionalCriar',
            path: 'novo',
            component: () => import('@/views/mdo.programasHabitacionais/ProgramaHabitacionalCriarEditar.vue'),
            meta: {
              título: 'Novo programa habitacional',
              rotasParaMigalhasDePão: [
                'mdoProgramaHabitacionalListar',
              ],
              limitarÀsPermissões: [
                'ProjetoProgramaMDO.inserir',
              ],
            },
          },
          {
            path: ':programaHabitacionalId',
            name: 'mdoProgramaHabitacionalEditar',
            component: () => import('@/views/mdo.programasHabitacionais/ProgramaHabitacionalCriarEditar.vue'),
            props: ({ params }) => ({
              ...params,
              ...{ programaHabitacionalId: Number.parseInt(params.programaHabitacionalId, 10) || undefined },
            }),

            meta: {
              título: 'Editar programa habitacional',
              rotasParaMigalhasDePão: [
                'mdoProgramaHabitacionalListar',
              ],
              limitarÀsPermissões: [
                'ProjetoProgramaMDO.editar',
              ],
            },
          },
        ],
      },
      {
        path: '/workflow',
        name: 'Workflow',
        component: WorkflowRaiz,
        meta: {
          título: 'Workflow',
          prefixoParaFilhas: 'TransferenciasVoluntarias',
          entidadeMãe: 'TransferenciasVoluntarias',
          limitarÀsPermissões: 'CadastroWorkflows.',
          rotasParaMenuSecundário: [
            'fluxosListar',
            'TransferenciasVoluntarias.etapasListar',
            'fasesListar',
            'tarefasListar',
            'situacaoListar',
            'statusDistribuicaoListar',
          ],
        },
        children: [
          {
            path: 'fluxo',
            name: 'fluxoRaiz',
            component: FluxosRaiz,
            meta: {
              título: 'Fluxo',
              rotaPrescindeDeChave: true,
            },

            children: [
              {
                name: 'fluxosListar',
                path: '',
                component: FluxosLista,
                meta: {
                  título: 'Fluxo',
                },
              },
              {
                name: 'fluxosCriar',
                path: 'nova',
                component: FluxosCriarEditar,
                meta: {
                  título: 'Novo fluxo',
                },
              },
              {
                path: ':fluxoId',
                name: 'fluxosEditar',
                component: FluxosCriarEditar,
                props: ({ params }) => ({
                  ...params,
                  ...{ fluxoId: Number.parseInt(params.fluxoId, 10) || undefined },
                }),
                meta: {
                  título: 'Editar fluxo',
                },
              },
            ],
          },
          {
            path: 'etapa',
            name: 'etapasRaiz',
            component: EtapasRaiz,
            meta: {
              título: 'Etapa',
              rotaPrescindeDeChave: true,
            },

            children: [
              {
                name: 'TransferenciasVoluntarias.etapasListar',
                path: '',
                component: EtapasLista,
                meta: {
                  título: 'Etapas',
                },
              },
              {
                name: 'TransferenciasVoluntarias.etapaCriar',
                path: 'nova',
                component: EtapasCriarEditar,
                meta: {
                  título: 'Nova etapa',
                },
              },
              {
                path: ':etapaId',
                name: 'TransferenciasVoluntarias.etapaEditar',
                component: EtapasCriarEditar,
                props: ({ params }) => ({
                  ...params,
                  ...{ etapaId: Number.parseInt(params.etapaId, 10) || undefined },
                }),

                meta: {
                  título: 'Editar etapa',
                },
              },
            ],
          },
          {
            path: 'fases',
            name: 'fasesRaiz',
            component: FasesRaiz,
            meta: {
              título: 'Fases',
              rotaPrescindeDeChave: true,
            },

            children: [
              {
                name: 'fasesListar',
                path: '',
                component: FasesLista,
                meta: {
                  título: 'Fases',
                },
              },
              {
                name: 'fasesCriar',
                path: 'nova',
                component: FasesCriarEditar,
                meta: {
                  título: 'Nova fase',
                },
              },
              {
                path: ':fasesId',
                name: 'fasesEditar',
                component: FasesCriarEditar,
                props: ({ params }) => ({
                  ...params,
                  ...{ fasesId: Number.parseInt(params.fasesId, 10) || undefined },
                }),

                meta: {
                  título: 'Editar fase',
                },
              },
            ],
          },
          {
            path: 'tarefas',
            name: 'tarefasRaiz',
            component: TarefasRaiz,
            meta: {
              título: 'Tarefas',
              rotaPrescindeDeChave: true,
            },

            children: [
              {
                name: 'tarefasListar',
                path: '',
                component: TarefasLista,
                meta: {
                  título: 'Tarefas',
                },
              },
              {
                name: 'tarefasCriar',
                path: 'nova',
                component: TarefasCriarEditar,
                meta: {
                  título: 'Nova tarefa',
                },
              },
              {
                path: ':tarefasId',
                name: 'tarefasEditar',
                component: TarefasCriarEditar,
                props: ({ params }) => ({
                  ...params,
                  ...{ tarefasId: Number.parseInt(params.tarefasId, 10) || undefined },
                }),

                meta: {
                  título: 'Editar tarefas',
                },
              },
            ],
          },
          {
            path: 'situacoes',
            name: 'situacaoRaiz',
            component: SituacaoRaiz,
            meta: {
              título: 'Situações',
              rotaPrescindeDeChave: true,
            },

            children: [
              {
                name: 'situacaoListar',
                path: '',
                component: SituacaoLista,
                meta: {
                  título: 'Situações',
                },
              },
              {
                name: 'situacaoCriar',
                path: 'nova',
                component: SituacaoCriarEditar,
                meta: {
                  título: 'Nova situação',
                },
              },
              {
                path: ':situacaoId',
                name: 'situacaoEditar',
                component: SituacaoCriarEditar,
                props: ({ params }) => ({
                  ...params,
                  ...{ situacaoId: Number.parseInt(params.situacaoId, 10) || undefined },
                }),

                meta: {
                  título: 'Editar situação',
                },
              },
            ],
          },
          {
            path: 'status-distribuicao',
            component: StatusDistribuicaoRaiz,
            meta: {
              título: 'Status de Distribuição',
              rotaPrescindeDeChave: true,
            },
            children: [
              {
                name: 'statusDistribuicaoListar',
                path: '',
                component: StatusDistribuicaoLista,
                meta: {
                  título: 'Status de Distribuição',
                },
              },
              {
                name: 'statusDistribuicaoCriar',
                path: 'novo',
                component: StatusDistribuicaoCriarEditar,
                meta: {
                  título: 'Novo Status de Distribuição',
                },
              },
              {
                path: ':statusDistribuicaoId',
                name: 'statusDistribuicaoEditar',
                component: StatusDistribuicaoCriarEditar,
                props: ({ params }) => ({
                  ...params,
                  // eslint-disable-next-line max-len
                  ...{ statusDistribuicaoId: Number.parseInt(params.statusDistribuicaoId, 10) || undefined },
                }),

                meta: {
                  título: 'Editar Status de Distribuição',
                },
              },
            ],
          },
        ],
      },

      {
        path: '/grupos-paineis-externos',
        component: GruposDePaineisExternosRaiz,
        meta: {
          título: 'Grupos de Painéis Externos',
          rotaPrescindeDeChave: true,
          limitarÀsPermissões: 'CadastroPainelExterno.',
          rotasParaMenuSecundário: [
            'paineisExternosListar',
            'grupospaineisExternosListar',
          ],
        },
        children: [
          {
            name: 'grupospaineisExternosListar',
            path: '',
            component: GruposDePaineisExternosLista,
            meta: {
              título: 'Grupos de Painéis Externos',
            },
          },
          {
            name: 'grupospaineisExternosCriar',
            path: 'novo',
            component: GruposDePaineisExternosCriarEditar,
            meta: {
              título: 'Novo Grupos de Painéis Externos',
            },
          },
          {
            path: ':gruposPaineisExternosId',
            name: 'gruposPaineisExternosEditar',
            component: GruposDePaineisExternosCriarEditar,
            props: ({ params }) => ({
              ...params,
              ...{
                gruposPaineisExternosId: Number.parseInt(params.gruposPaineisExternosId, 10)
                  || undefined,
              },
            }),

            meta: {
              título: 'Editar grupo de painel externo',
            },
          },
        ],
      },

      {
        path: 'grupos-de-observadores',
        component: GruposDeObservadoresRaiz,
        meta: {
          título: 'Grupos de observadores',
          títuloParaMenu: 'Grupos de observadores',
          entidadeMãe: 'projeto',
          limitarÀsPermissões: [
            'Projeto.administrar_portfolios',
            'Projeto.administrador_no_orgao',
          ],

          rotasParaMenuSecundário: [
            'portfoliosListar',
            'gruposDeObservadoresListar',
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
              título: 'Editar Novo grupo de observadores',
            },
          },
        ],
      },
    ],
  },

  // PDM
  {
    path: '/pdm',
    meta: {
      limitarÀsPermissões: 'CadastroPdm.',
      título: 'Programa de metas',
      entidadeMãe: 'pdm',
      rotasParaMenuPrincipal,
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
    path: '/paineis',
    meta: {
      entidadeMãe: 'pdm',
      limitarÀsPermissões: [
        'CadastroPainel.inserir',
        'CadastroMeta.administrador_no_pdm',
      ],
      título: 'Painéis de metas',
      rotasParaMenuSecundário,
      rotasParaMenuPrincipal,
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
      entidadeMãe: 'pdm',
      limitarÀsPermissões: [
        'CadastroGrupoPaineis.inserir',
        'CadastroGrupoPaineis.editar',
        'CadastroGrupoPaineis.remover',
      ],
      título: 'Grupos de paineis',
      rotasParaMenuSecundário,
      rotasParaMenuPrincipal,
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
];
