import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';

export default {
  path: '/planos-setoriais',
  component: () => import('@/views/planosSetoriais/PlanosSetoriaisRaiz.vue'),

  meta: {
    título: 'Planos setoriais',
    íconeParaMenu: `<svg width="18" height="20" viewBox="0 0 18 20" fill="currentColor">
<path d="M16.9948 0.00629546H0.999714C0.734573 0.00629546 0.480291 0.111637 0.292809 0.299119C0.105326 0.486602 0 0.740869 0 1.00601V19.0003C0.0225224 19.2579 0.135082 19.4993 0.31791 19.6821C0.500737 19.8649 0.74214 19.9775 0.999714 20H16.9948C17.26 20 17.5143 19.8947 17.7018 19.7072C17.8892 19.5197 17.9946 19.2654 17.9946 19.0003V1.00601C18.0106 0.870853 17.9958 0.733824 17.9513 0.605215C17.9067 0.476606 17.8336 0.359789 17.7373 0.263546C17.6411 0.167303 17.5243 0.0941436 17.3957 0.0495875C17.267 0.00503137 17.13 -0.00978041 16.9948 0.00629546ZM1.99943 2.00572H3.99886V18.0006H1.99943V2.00572ZM15.9951 18.0006H5.99828V2.00572H8.99714V8.99742L11.4964 6.998L13.9957 8.99742V2.00572H15.9951V18.0006Z" />
</svg>`,
    rotaPrescindeDeChave: true,
    limitarÀsPermissões: [
      'CadastroPS.',
      'CadastroSubTema.inserir',
    ],
  },
  children: [
    {
      name: 'planosSetoriaisListar',
      path: '',
      component: () => import('@/views/planosSetoriais/PlanosSetoriaisLista.vue'),
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
        rotaDeEscape: 'planosSetoriaisResumo',
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
            rotaDeEscape: 'planosSetoriaisResumo',
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
            título: 'Resumo de Plano Setorial',
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
                título: 'Tag',
              },
            },
            {
              path: 'novo',
              name: 'planosSetoriaisNovaTag',
              component: () => import('@/views/ps.tags/TagsCriarEditar.vue'),
              meta: {
                rotaDeEscape: 'planosSetoriaisTags',
                título: 'Nova Tag',
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
                rotaDeEscape: 'planosSetoriaisMacrotemas',
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_macro_tema || 'Novo Macrotema',
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
                rotaDeEscape: 'planosSetoriaisTemas',
                título: () => usePlanosSetoriaisStore()?.emFoco?.rotulo_tema || 'Novo Tema',
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
                  'CadastroSubTema.inserir',
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
              },
            },
          ],
        },
      ],
    },
  ],
};
