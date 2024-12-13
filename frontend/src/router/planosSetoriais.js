import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import metas from './metasDePlanosSetoriais';

export default {
  path: '/planos-setoriais',
  component: () => import('@/views/planosSetoriais/PlanosSetoriaisRaiz.vue'),

  meta: {
    título: 'Planos setoriais',
    entidadeMãe: 'planoSetorial',
    íconeParaMenu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<circle cx="5" cy="19" r="2" fill="#152741"/>
<path d="M18 11H14.82C14.4 9.84 13.3 9 12 9C10.7 9 9.6 9.84 9.18 11H6C5.67 11 4 10.9 4 9V8.00001C4 6.17001 5.54 6.00001 6 6.00001H16.18V8.37004L21.5 4.99999L16.18 1.68481C16.18 1.68481 16.18 2.278 16.18 4.00001H6C4.39 4.00001 2 5.06001 2 8.00001V9C2 11.94 4.39 13 6 13H9.18C9.6 14.16 10.7 15 12 15C13.3 15 14.4 14.16 14.82 13H18C18.33 13 20 13.1 20 15V16C20 17.83 18.46 18 18 18H7.82C7.4 16.84 6.3 16 5 16C4.20435 16 3.44129 16.3161 2.87868 16.8787C2.31607 17.4413 2 18.2044 2 19C2 19.7957 2.31607 20.5587 2.87868 21.1213C3.44129 21.6839 4.20435 22 5 22C6.3 22 7.4 21.16 7.82 20H18C19.61 20 22 18.93 22 16V15C22 12.07 19.61 11 18 11ZM5 20C4.73478 20 4.48043 19.8947 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19C4 18.7348 4.10536 18.4804 4.29289 18.2929C4.48043 18.1054 4.73478 18 5 18C5.26522 18 5.51957 18.1054 5.70711 18.2929C5.89464 18.4804 6 18.7348 6 19C6 19.2652 5.89464 19.5196 5.70711 19.7071C5.51957 19.8947 5.26522 20 5 20Z"/>
</svg>`,
    rotaPrescindeDeChave: true,
    presenteNoMenu: true,
    pesoNoMenu: 2,
    limitarÀsPermissões: [
      'CadastroPS.',
      'CadastroMetaPS.listar',
    ],
  },
  children: [
    {
      name: 'planosSetoriaisListar',
      path: '',
      component: () => import('@/views/planosSetoriais/PlanosSetoriaisLista.vue'),
      meta: {
        // não entendi o motivo dessa rota não herdar a propriedade `meta` da mãe
        limitarÀsPermissões: [
          'CadastroPS.',
          'CadastroMetaPS.listar',
        ],
      },
    },
    {
      name: 'planosSetoriaisCriar',
      path: 'novo',
      component: () => import('@/views/planosSetoriais/PlanosSetoriaisCriarEditar.vue'),
      meta: {
        limitarÀsPermissões: [
          'CadastroPS.administrador',
          'CadastroPS.administrador_no_orgao',
        ],
        rotaDeEscape: 'planosSetoriaisListar',
        rotasParaMigalhasDePão: [
          'planosSetoriaisListar',
        ],
        título: 'Cadastro de Plano Setorial',
      },
    },
    {
      path: ':planoSetorialId',
      props: ({ params }) => ({
        ...params,
        planoSetorialId: Number.parseInt(params.planoSetorialId, 10) || undefined,
      }),
      meta: {
        rotasParaMenuSecundário: () => {
          const rotas = [
            'planosSetoriaisResumo',
            'planosSetoriaisDocumentos',
          ];

          if (usePlanosSetoriaisStore()?.emFoco?.possui_macro_tema) {
            rotas.push('planosSetoriaisMacrotemas');
          }
          if (usePlanosSetoriaisStore()?.emFoco?.possui_tema) {
            rotas.push('planosSetoriaisTemas');
          }
          if (usePlanosSetoriaisStore()?.emFoco?.possui_sub_tema) {
            rotas.push('planosSetoriaisSubtemas');
          }
          rotas.push('planoSetorial:listaDeMetas');
          rotas.push('planosSetoriaisTags');
          return rotas;
        },
        rotasParaMigalhasDePão: [
          'planosSetoriaisListar',
        ],
      },
      component: () => import('@/views/planosSetoriais/PlanosSetoriaisItem.vue'),
      children: [
        {
          path: '',
          name: 'planosSetoriaisEditar',
          component: () => import('@/views/planosSetoriais/PlanosSetoriaisCriarEditar.vue'),
          props: ({ params }) => ({
            ...params,
            planoSetorialId: Number.parseInt(params.planoSetorialId, 10) || undefined,
          }),
          meta: {
            limitarÀsPermissões: [
              'CadastroPS.administrador',
              'CadastroPS.administrador_no_orgao',
            ],
            rotaDeEscape: 'planosSetoriaisListar',
            título: 'Editar Plano Setorial',
          },
        },
        {
          path: 'resumo',
          name: 'planosSetoriaisResumo',
          component: () => import('@/views/planosSetoriais/PlanosSetoriaisResumo.vue'),
          props: ({ params }) => ({
            ...params,
            planoSetorialId: Number.parseInt(params.planoSetorialId, 10) || undefined,
          }),
          meta: {
            título: () => usePlanosSetoriaisStore()?.emFoco?.nome || 'Resumo de Plano Setorial',
            títuloParaMenu: 'Resumo',
          },
        },
        {
          path: 'documentos',
          name: 'planosSetoriaisDocumentos',
          component: () => import('@/views/planosSetoriais/PlanosSetoriaisDocumentos.vue'),
          props: ({ params }) => ({
            ...params,
            planoSetorialId: Number.parseInt(params.planoSetorialId, 10) || undefined,
          }),
          meta: {
            título: 'Documentos de Plano Setorial',
            títuloParaMenu: 'Documentos',
          },
          children: [
            {
              path: 'novo',
              name: 'planosSetoriaisNovoDocumento',
              component: () => import('@/views/planosSetoriais/PlanosSetoriaisEnviarArquivo.vue'),
              meta: {
                rotaDeEscape: 'planosSetoriaisDocumentos',
                títuloParaMenu: 'Novo documento',
              },
            },
            {
              path: ':arquivoId',
              name: 'planosSetoriaisEditarDocumento',
              component: () => import('@/views/planosSetoriais/PlanosSetoriaisEnviarArquivo.vue'),
              props: ({ params }) => ({
                ...params,
                ...{ arquivoId: Number.parseInt(params.arquivoId, 10) || undefined },
              }),
              meta: {
                rotaDeEscape: 'planosSetoriaisDocumentos',
                títuloParaMenu: 'Editar documento',
              },
            },
          ],
        },
        {
          path: 'tag',
          component: () => import('@/views/ps.tags/TagsRaiz.vue'),
          children: [
            {
              path: '',
              name: 'planosSetoriaisTags',
              component: () => import('@/views/ps.tags/TagsLista.vue'),
              meta: {
                título: 'Tags',
              },
            },
            {
              path: 'novo',
              name: 'planosSetoriaisNovaTag',
              component: () => import('@/views/ps.tags/TagsCriarEditar.vue'),
              meta: {
                título: 'Nova Tag',
                limitarÀsPermissões: [
                  'CadastroTagPS.inserir',
                ],
                rotaDeEscape: 'planosSetoriaisTags',
              },
            },
            {
              path: ':tagId',
              name: 'planosSetoriaisEditarTag',
              component: () => import('@/views/ps.tags/TagsCriarEditar.vue'),
              props: ({ params }) => ({
                ...params,
                ...{ tagId: Number.parseInt(params.tagId, 10) || undefined },
              }),
              meta: {
                título: 'Editar Tag',
                limitarÀsPermissões: [
                  'CadastroTagPS.editar',
                ],
                rotaDeEscape: 'planosSetoriaisTags',
              },
            },
          ],
        },
        {
          path: 'macrotema',
          component: () => import('@/views/ps.macrotemas/MacrotemasRaiz.vue'),
          children: [
            {
              path: '',
              name: 'planosSetoriaisMacrotemas',
              component: () => import('@/views/ps.macrotemas/MacrotemasLista.vue'),
              meta: {
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_macro_tema || 'Macrotema',
              },
            },
            {
              path: 'novo',
              name: 'planosSetoriaisNovoMacrotema',
              component: () => import('@/views/ps.macrotemas/MacrotemasCriarEditar.vue'),
              meta: {
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_macro_tema || 'Novo Macrotema',
                limitarÀsPermissões: [
                  'CadastroMacroTemaPS.inserir',
                ],
                rotaDeEscape: 'planosSetoriaisMacrotemas',
              },
            },
            {
              path: ':macrotemaId',
              name: 'planosSetoriaisEditarMacrotema',
              component: () => import('@/views/ps.macrotemas/MacrotemasCriarEditar.vue'),
              props: ({ params }) => ({
                ...params,
                ...{ macrotemaId: Number.parseInt(params.macrotemaId, 10) || undefined },
              }),
              meta: {
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_macro_tema || 'Editar Macrotema',
                limitarÀsPermissões: [
                  'CadastroMacroTemaPS.editar',
                ],
                rotaDeEscape: 'planosSetoriaisMacrotemas',
              },
            },
          ],
        },
        {
          path: 'tema',
          component: () => import('@/views/ps.temas/TemasRaiz.vue'),
          children: [
            {
              path: '',
              name: 'planosSetoriaisTemas',
              component: () => import('@/views/ps.temas/TemasLista.vue'),
              meta: {
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_tema || 'Tema',
              },
            },
            {
              path: 'novo',
              name: 'planosSetoriaisNovoTema',
              component: () => import('@/views/ps.temas/TemasCriarEditar.vue'),
              meta: {
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_tema || 'Novo Tema',
                limitarÀsPermissões: [
                  'CadastroTemaPS.inserir',
                ],
                rotaDeEscape: 'planosSetoriaisTemas',
              },
            },
            {
              path: ':temaId',
              name: 'planosSetoriaisEditarTema',
              component: () => import('@/views/ps.temas/TemasCriarEditar.vue'),
              props: ({ params }) => ({
                ...params,
                ...{ temaId: Number.parseInt(params.temaId, 10) || undefined },
              }),
              meta: {
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_tema || 'Editar Tema',
                limitarÀsPermissões: [
                  'CadastroTemaPS.editar',
                ],
                rotaDeEscape: 'planosSetoriaisTemas',
              },
            },
          ],
        },
        {
          path: 'subtema',
          component: () => import('@/views/ps.subtemas/SubtemasRaiz.vue'),
          children: [
            {
              path: '',
              name: 'planosSetoriaisSubtemas',
              component: () => import('@/views/ps.subtemas/SubtemasLista.vue'),
              meta: {
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_sub_tema || 'Subtema',
              },
            },
            {
              path: 'novo',
              name: 'planosSetoriaisNovoSubtema',
              component: () => import('@/views/ps.subtemas/SubtemasCriarEditar.vue'),
              meta: {
                rotaDeEscape: 'planosSetoriaisSubtemas',
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_sub_tema || 'Novo Subtema',
                limitarÀsPermissões: [
                  'CadastroSubTemaPS.inserir',
                ],
              },
            },
            {
              path: ':subtemaId',
              name: 'planosSetoriaisEditarSubtema',
              component: () => import('@/views/ps.subtemas/SubtemasCriarEditar.vue'),
              props: ({ params }) => ({
                ...params,
                ...{ subtemaId: Number.parseInt(params.subtemaId, 10) || undefined },
              }),
              meta: {
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_sub_tema || 'Editar Subtema',
                rotaDeEscape: 'planosSetoriaisSubtemas',
                limitarÀsPermissões: [
                  'CadastroSubTemaPS.editar',
                ],
              },
            },
          ],
        },
        {
          path: 'metas',
          props: true,
          component: () => import('@/views/planosSetoriais/PlanoSetoriaisMetas.vue'),

          meta: {
            // possível apenas porque os valores to tipo `function` são
            // executados no guarda `router.beforeEach()`.Veja `/router/index`.
            prefixoDosCaminhos: (route) => `/planos-setoriais/${route.params.planoSetorialId}`,

            título: () => `Metas de ${usePlanosSetoriaisStore()?.emFoco?.nome || 'Plano Setorial'}`,
            títuloParaMenu: 'Metas',
            desabilitarMigalhasDePãoPadrão: true,
          },

          children: metas,
        },
      ],
    },
  ],
};
