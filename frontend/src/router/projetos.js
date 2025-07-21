import { defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import LoadingComponent from '@/components/LoadingComponent.vue';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import ProjetosRaiz from '@/views/projetos/ProjetosRaiz.vue';
import acompanhamentos from './acompanhamentos';
import licoesAprendidas from './licoesAprendidas';
import processos from './processos';
import contratos from './projetos.contratos';
import projetosOrcamentos from './projetos.orcamentos';
import riscos from './riscos';
import tarefas from './tarefas';

const MenuSecundário = defineAsyncComponent({
  loader: () => import('@/components/MenuSecundario.vue'),
  loadingComponent: LoadingComponent,
});
const DialogWrapper = defineAsyncComponent({
  loader: () => import('@/views/DialogWrapper.vue'),
  loadingComponent: LoadingComponent,
});
const ProjetoEnviarArquivo = defineAsyncComponent({
  loader: () => import('@/views/projetos/ProjetoEnviarArquivo.vue'),
  loadingComponent: LoadingComponent,
});
const ProjetosCriarEditar = defineAsyncComponent({
  loader: () => import('@/views/projetos/ProjetosCriarEditar.vue'),
  loadingComponent: LoadingComponent,
});
const ProjetosDocumentos = defineAsyncComponent({
  loader: () => import('@/views/projetos/ProjetosDocumentos.vue'),
  loadingComponent: LoadingComponent,
});
const ProjetosEstruturaAnalitica = defineAsyncComponent({
  loader: () => import('@/views/projetos/ProjetosEstruturaAnalitica.vue'),
  loadingComponent: LoadingComponent,
});
const ProjetosGantt = defineAsyncComponent({
  loader: () => import('@/views/projetos/ProjetosGantt.vue'),
  loadingComponent: LoadingComponent,
});
const ProjetosItem = defineAsyncComponent({
  loader: () => import('@/views/projetos/ProjetosItem.vue'),
  loadingComponent: LoadingComponent,
});
const ProjetosLista = () => import('@/views/projetos/ProjetosLista/ProjetosLista.vue');
const ProjetosResumo = defineAsyncComponent({
  loader: () => import('@/views/projetos/ProjetosResumo.vue'),
  loadingComponent: LoadingComponent,
});

export default {
  path: '/projetos',
  component: ProjetosRaiz,
  name: 'projetosRaiz',
  redirect: '/projetos/todos',
  props: {
    submenu: MenuSecundário,
  },

  meta: {
    entidadeMãe: 'projeto',
    título: 'Painel de Projetos',
    íconeParaMenu: `<svg width="18" height="20" viewBox="0 0 18 20" fill="currentColor">
<path d="M16.9948 0.00629546H0.999714C0.734573 0.00629546 0.480291 0.111637 0.292809 0.299119C0.105326 0.486602 0 0.740869 0 1.00601V19.0003C0.0225224 19.2579 0.135082 19.4993 0.31791 19.6821C0.500737 19.8649 0.74214 19.9775 0.999714 20H16.9948C17.26 20 17.5143 19.8947 17.7018 19.7072C17.8892 19.5197 17.9946 19.2654 17.9946 19.0003V1.00601C18.0106 0.870853 17.9958 0.733824 17.9513 0.605215C17.9067 0.476606 17.8336 0.359789 17.7373 0.263546C17.6411 0.167303 17.5243 0.0941436 17.3957 0.0495875C17.267 0.00503137 17.13 -0.00978041 16.9948 0.00629546ZM1.99943 2.00572H3.99886V18.0006H1.99943V2.00572ZM15.9951 18.0006H5.99828V2.00572H8.99714V8.99742L11.4964 6.998L13.9957 8.99742V2.00572H15.9951V18.0006Z" />
</svg>`,
    rotaPrescindeDeChave: true,
    limitarÀsPermissões: [
      'Projeto.administrar_portfolios',
      'Projeto.administrar_portfolios_no_orgao',
      'SMAE.gestor_de_projeto',
      'SMAE.colaborador_de_projeto',
      'SMAE.espectador_de_projeto',
    ],
  },
  children: [
    {
      name: 'projetosListar',
      path: 'todos',
      component: ProjetosLista,
      props: ({ params, query }) => ({
        ...params,
        // eslint-disable-next-line no-nested-ternary
        status: Array.isArray(query.status)
          ? query.status.map((x) => x.replace('_', '').toLowerCase())
          : query.status
            ? [query.status.replace('_', '').toLowerCase()]
            : [],
      }),
    },

    {
      name: 'projetosListarPrioritários',
      path: 'prioritarios',
      component: ProjetosLista,
      meta: {
        título: 'Projetos ativos',
        títuloParaMenu: 'Ativos',
      },
      props: ({ params, query }) => ({
        ...params,
        status: query.status?.replace('_', '').toLowerCase(),
        apenasPrioritários: true,
      }),
    },

    {
      name: 'projetosListarArquivados',
      path: 'arquivados',
      component: ProjetosLista,
      meta: {
        título: 'Arquivo de projetos',
        títuloParaMenu: 'Arquivo',
      },
      props: ({ params, query }) => ({
        ...params,
        status: query.status?.replace('_', '').toLowerCase(),
        apenasArquivados: true,
      }),
    },

    {
      name: 'projetosCriar',
      path: 'novo',
      component: ProjetosCriarEditar,
      meta: {
        título: 'Novo projeto',
        títuloParaMenu: 'Novo projeto',

        limitarÀsPermissões: [
          'Projeto.administrador_no_orgao',
          'Projeto.administrador',
        ],
        rotasParaMigalhasDePão: [
          'projetosListar',
        ],
      },
    },

    {
      path: ':projetoId',
      component: ProjetosItem,
      props: ({ params }) => ({
        ...params,
        projetoId: Number.parseInt(params.projetoId, 10) || undefined,
      }),
      meta: {
        rotasParaMenuSecundário: () => {
          const rotasDePlanoDeProjeto = {
            título: 'Plano de projeto',
            rotas: [
              'projetosResumo',
              'projetoTarefasListar',
              'projetosEAP',
              'projetosGantt',
            ],
          };

          const rotasDeAcompanhamento = {
            título: 'Acompanhamento',
            rotas: [
              'acompanhamentosListar',
              'riscosListar',
              'projetosDocumentos',
              'processosListar',
              'contratosDoProjetoListar',
            ],
          };

          const rotasDeEncerramento = {
            título: 'Encerramento',
            rotas: [
              'liçõesAprendidasListar',
            ],
          };

          const orçamentos = {
            título: 'Visão orçamentária',
            rotas: [
              'ProjetoOrçamentoCusto',
              'ProjetoOrçamentoPlanejado',
              'ProjetoOrçamentoRealizado',
            ],
          };

          return [
            rotasDePlanoDeProjeto,
            rotasDeAcompanhamento,
            rotasDeEncerramento,
            orçamentos,
          ];
        },

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
        ],
      },

      children: [
        {
          path: '',
          name: 'projetosEditar',
          component: ProjetosCriarEditar,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
          }),
          meta: {
            título: 'Editar projeto',
            títuloParaMenu: 'Editar projeto',
            rotaDeEscape: 'projetosResumo',
            limitarÀsPermissões: [
              'Projeto.administrador_no_orgao',
              'Projeto.administrador',
              'SMAE.colaborador_de_projeto',
              'SMAE.gerente_de_projeto',
            ],
          },

          children: [
            {
              path: 'trocar-portfolio',
              name: 'projetosTrocarPortfolio',
              component: () => import('@/views/projetos/TransferirDePortfolio.vue'),
              meta: {
                título: 'Transferir de portfólio',
                rotaDeEscape: 'projetosEditar',
              },
              props: ({ params }) => ({
                ...params,
                projetoId: Number.parseInt(params.projetoId, 10) || undefined,
              }),
            },
          ],
        },

        {
          path: 'escopo',
          name: 'projetosResumo',
          component: ProjetosResumo,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
          }),
          meta: {
            rotasParaMigalhasDePão: [
              'projetosListar',
            ],
            título: () => {
              const { name: routeName } = useRoute();
              const projetoStoreEmFoco = useProjetosStore()?.emFoco?.nome;
              if (!projetoStoreEmFoco) {
                return 'Escopo';
              }

              if (routeName === 'projetosResumo') {
                return `Escopo: ${projetoStoreEmFoco}`;
              }

              return `Projeto ${projetoStoreEmFoco}`;
            },
            títuloParaMenu: 'Escopo',
          },
        },

        {
          path: 'estrutura-analitica',
          name: 'projetosEAP',
          component: ProjetosEstruturaAnalitica,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
          }),
          meta: {
            título: 'Estrutura Analítica',
            títuloParaMenu: 'Estrutura Analítica',
          },
        },

        {
          path: 'gantt',
          name: 'projetosGantt',
          component: ProjetosGantt,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
          }),
          meta: {
            título: 'Gantt',
            títuloParaMenu: 'Gráfico de Gantt',
          },
        },

        tarefas,
        riscos,
        acompanhamentos,
        licoesAprendidas,

        {
          path: 'documentos',
          name: 'projetosDocumentos',
          component: ProjetosDocumentos,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
          }),
          meta: {
            título: 'Documentos',
            títuloParaMenu: 'Documentos',
          },

          children: [
            {
              path: 'novo',
              component: DialogWrapper,
              meta: {
                rotaDeEscape: 'projetosDocumentos',
                título: 'Novo documento do projeto',
                títuloParaMenu: 'Novo documento',
              },
              children: [
                {
                  path: '',
                  name: 'projetosNovoDocumento',
                  component: ProjetoEnviarArquivo,
                },
              ],
            },
            {
              path: ':arquivoId',
              component: DialogWrapper,
              props: ({ params }) => ({
                ...params,
                arquivoId: Number.parseInt(params.arquivoId, 10) || undefined,
              }),
              meta: {
                rotaDeEscape: 'projetosDocumentos',
                título: 'Editar documento do projeto',
                títuloParaMenu: 'Editar documento',
              },
              children: [
                {
                  path: '',
                  name: 'projetosEditarDocumento',
                  component: ProjetoEnviarArquivo,
                },
              ],
            },
          ],
        },

        processos,

        projetosOrcamentos,

        contratos,
      ],
    },
  ],
};
