import obrasAcompanhamentos from './obras.acompanhamentos';
import obrasOrcamentos from './obras.orcamentos';
import obrasProcessos from './obras.processos';
import obrasContratos from './obras.contratos';

export default {
  path: '/obras',
  component: () => import('@/views/mdo.obras/ObraRaiz.vue'),
  meta: {
    título: 'Painel de obras',
    íconeParaMenu: `<svg width="18" height="20" viewBox="0 0 18 20" fill="currentColor">
<path d="M16.9948 0.00629546H0.999714C0.734573 0.00629546 0.480291 0.111637 0.292809 0.299119C0.105326 0.486602 0 0.740869 0 1.00601V19.0003C0.0225224 19.2579 0.135082 19.4993 0.31791 19.6821C0.500737 19.8649 0.74214 19.9775 0.999714 20H16.9948C17.26 20 17.5143 19.8947 17.7018 19.7072C17.8892 19.5197 17.9946 19.2654 17.9946 19.0003V1.00601C18.0106 0.870853 17.9958 0.733824 17.9513 0.605215C17.9067 0.476606 17.8336 0.359789 17.7373 0.263546C17.6411 0.167303 17.5243 0.0941436 17.3957 0.0495875C17.267 0.00503137 17.13 -0.00978041 16.9948 0.00629546ZM1.99943 2.00572H3.99886V18.0006H1.99943V2.00572ZM15.9951 18.0006H5.99828V2.00572H8.99714V8.99742L11.4964 6.998L13.9957 8.99742V2.00572H15.9951V18.0006Z" />
</svg>`,
    rotaPrescindeDeChave: true,
    presenteNoMenu: true,
    pesoNoMenu: 1,
    entidadeMãe: 'obras',
    limitarÀsPermissões: [
      'MDO.',
      'ProjetoMDO.',
    ],
  },
  children: [
    {
      name: 'obrasListar',
      path: '',
      component: () => import('@/views/mdo.obras/ObrasListar.vue'),
      props: true,
      meta: {
        limitarÀsPermissões: [
          'ProjetoMDO.administrador',
          'ProjetoMDO.administrador_no_orgao',
          'MDO.gestor_de_projeto',
          'MDO.colaborador_de_projeto',
          'MDO.espectador_de_projeto',
        ],
      },
    },
    {
      name: 'obrasCriar',
      path: 'novo',
      component: () => import('@/views/mdo.obras/ObraCriarEditar.vue'),
      props: true,
      meta: {
        limitarÀsPermissões: [
          'ProjetoMDO.administrador_no_orgao',
        ],
        rotaDeEscape: 'obrasListar',
        rotasParaMigalhasDePão: [
          'obrasListar',
        ],
        título: 'Cadastro de Obras',
      },
    },
    {
      path: ':obraId',
      props: ({ params }) => ({
        ...params,
        obraId: Number.parseInt(params.obraId, 10) || undefined,
      }),
      component: () => import('@/views/mdo.obras/ObraItem.vue'),
      meta: {
        rotasParaMigalhasDePão: [
          'obrasListar',
        ],
        rotasParaMenuSecundário: [
          {
            título: 'Plano da obra',
            rotas: [
              'obrasResumo',
              'obrasTarefasListar',
            ],
          },
          {
            título: 'Acompanhamento',
            rotas: [
              'acompanhamentosDeObrasListar',
              'obrasDocumentos',
              'processosDaObraListar',
              'contratosDaObraListar',
            ],
          },
          {
            título: 'Visão orçamentária',
            rotas: [
              'obrasOrçamentoCusto',
              'obrasOrçamentoPlanejado',
              'obrasOrçamentoRealizado',
            ],
          },
        ],
      },
      children: [
        {
          path: '',
          name: 'obrasEditar',
          component: () => import('@/views/mdo.obras/ObraCriarEditar.vue'),
          props: ({ params }) => ({
            ...params,
            obraId: Number.parseInt(params.obraId, 10) || undefined,
          }),
          meta: {
            limitarÀsPermissões: [
              'ProjetoMDO.administrador',
              'ProjetoMDO.administrador_no_orgao',
              'MDO.gestor_de_projeto',
              'MDO.colaborador_de_projeto',
              'MDO.espectador_de_projeto',
            ],
            rotaDeEscape: 'obrasResumo',
            título: 'Editar Obra',
          },
        },
        {
          path: 'resumo',
          name: 'obrasResumo',
          component: () => import('@/views/mdo.obras/ObraResumo.vue'),
          props: ({ params }) => ({
            ...params,
            obraId: Number.parseInt(params.obraId, 10) || undefined,
          }),
          meta: {
            título: 'Escopo da Obra',
            títuloParaMenu: 'Escopo',
          },
        },
        {
          path: 'tarefas',
          component: () => import('@/views/tarefas/TarefasRaiz.vue'),
          props: true,
          meta: {
            títuloParaMenu: 'Tarefas',
            entidadeMãe: 'obras',
            rotasParaMigalhasDePão: [
              'obrasListar',
              'obrasResumo',
              'obrasEditar', // PRA-FAZER: trocar pela de resumo, quando estiver pronta
            ],
          },
          children: [
            {
              name: 'obrasTarefasListar',
              path: '',
              component: () => import('@/views/tarefas/TarefasLista.vue'),
              props: true,
              meta: {
                título: 'Cronograma de obra',
                títuloParaMenu: 'Cronograma',
              },
              children: [
                {
                  name: 'obras.TarefasClonar',
                  path: 'clonar',
                  component: () => import('@/views/mdo.tarefas/TarefasClonar.vue'),
                  meta: {
                    título: 'Clonar tarefas',
                    títuloParaMenu: 'Clonar tarefas',
                    rotaDeEscape: 'obrasTarefasListar',
                  },
                },
              ],
            },
            {
              name: 'obras.TarefasCriar',
              path: 'nova',
              component: () => import('@/views/tarefas/TarefasCriarEditar.vue'),
              props: true,
              meta: {
                título: 'Nova tarefa',
                títuloParaMenu: 'Nova tarefa',
                rotaDeEscape: 'obrasTarefasListar',
              },
            },
            {
              path: ':tarefaId',
              component: () => import('@/views/tarefas/TarefasItem.vue'),
              props: true,
              children: [
                {
                  path: '',
                  name: 'obras.TarefasEditar',
                  component: () => import('@/views/tarefas/TarefasCriarEditar.vue'),
                  props: true,
                  meta: {
                    título: 'Editar tarefa',
                    títuloParaMenu: 'Editar tarefa',
                    rotaDeEscape: 'obrasTarefasListar',
                  },
                },
                {
                  name: 'obras.TarefasDetalhes',
                  path: 'resumo',
                  component: () => import('@/views/tarefas/TarefasDetalhe.vue'),
                  props: ({ params }) => ({
                    ...params,
                    obraId: Number.parseInt(params.obraId, 10) || undefined,
                    tarefaId: Number.parseInt(params.tarefaId, 10) || undefined,
                  }),
                  meta: {
                    título: 'Resumo Atividade',
                    rotaDeEscape: 'obrasListar',
                    rotasParaMigalhasDePão: [
                      'obrasListar',
                      'obrasResumo',
                      'obrasTarefasListar',
                    ],
                  },
                },
                {
                  path: 'progresso',
                  name: 'obras.TarefasProgresso',
                  component: () => import('@/views/tarefas/TarefasProgresso.vue'),
                  props: true,
                  meta: {
                    título: 'Registrar progresso',
                    títuloParaMenu: 'Progresso',

                    rotaDeEscape: 'obrasTarefasListar',

                    rotasParaMigalhasDePão: [
                      'obrasListar',
                      'obrasResumo',
                      'obrasEditar', // PRA-FAZER: trocar pela de resumo, quando estiver pronta
                      'obrasTarefasListar',
                      'obras.TarefasEditar',
                    ],
                  },
                },
              ],
            },
          ],
        },

        {
          path: 'documentos',
          name: 'obrasDocumentos',
          component: () => import('@/views/mdo.obras/ObrasDocumentos.vue'),
          props: true,
          meta: {
            título: 'Documentos de Obra',
            títuloParaMenu: 'Documentos',
          },
          children: [
            {
              path: 'novo',
              name: 'obrasNovoDocumento',
              component: () => import('@/views/mdo.obras/ObrasEnviarArquivo.vue'),
              meta: {
                rotaDeEscape: 'obrasDocumentos',
                títuloParaMenu: 'Novo documento',
              },
            },
            {
              path: ':arquivoId',
              name: 'obrasEditarDocumento',
              component: () => import('@/views/mdo.obras/ObrasEnviarArquivo.vue'),
              props: true,
              meta: {
                rotaDeEscape: 'obrasDocumentos',
                títuloParaMenu: 'Editar documento',
              },
            },
          ],
        },

        obrasAcompanhamentos,
        obrasProcessos,
        obrasContratos,
        obrasOrcamentos,
      ],
    },
  ],
};
