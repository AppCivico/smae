import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';

import metas from '../metasDePlanosSetoriais';

type EntidadesPossiveis = 'planoSetorial' | 'programaDeMetas';
type TituloDaPagina = {
  singular: string;
  plural: string;
};

function obterTitulo(entidadeMãe: EntidadesPossiveis): TituloDaPagina {
  switch (entidadeMãe) {
    case 'planoSetorial':
      return {
        singular: 'Plano Setorial',
        plural: 'Planos Setoriais',
      };

    case 'programaDeMetas':
      return {
        singular: 'Programa de Meta',
        plural: 'Programa de Metas',
      };

    default:
      throw new Error(`Entidade mãe "${entidadeMãe}" não encontrada`);
  }
}

function prepararRotasParaProgramaDeMetas(entidadeMãe: EntidadesPossiveis) {
  const tituloEntidade = obterTitulo(entidadeMãe);

  return {
    path: '/planos-setoriais',
    component: () => import('@/views/planosSetoriais/PlanosSetoriaisRaiz.vue'),

    meta: {
      título: tituloEntidade.plural,
      entidadeMãe,
      íconeParaMenu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<circle cx="5" cy="19" r="2" fill="#152741"/>
<path d="M18 11H14.82C14.4 9.84 13.3 9 12 9C10.7 9 9.6 9.84 9.18 11H6C5.67 11 4 10.9 4 9V8.00001C4 6.17001 5.54 6.00001 6 6.00001H16.18V8.37004L21.5 4.99999L16.18 1.68481C16.18 1.68481 16.18 2.278 16.18 4.00001H6C4.39 4.00001 2 5.06001 2 8.00001V9C2 11.94 4.39 13 6 13H9.18C9.6 14.16 10.7 15 12 15C13.3 15 14.4 14.16 14.82 13H18C18.33 13 20 13.1 20 15V16C20 17.83 18.46 18 18 18H7.82C7.4 16.84 6.3 16 5 16C4.20435 16 3.44129 16.3161 2.87868 16.8787C2.31607 17.4413 2 18.2044 2 19C2 19.7957 2.31607 20.5587 2.87868 21.1213C3.44129 21.6839 4.20435 22 5 22C6.3 22 7.4 21.16 7.82 20H18C19.61 20 22 18.93 22 16V15C22 12.07 19.61 11 18 11ZM5 20C4.73478 20 4.48043 19.8947 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19C4 18.7348 4.10536 18.4804 4.29289 18.2929C4.48043 18.1054 4.73478 18 5 18C5.26522 18 5.51957 18.1054 5.70711 18.2929C5.89464 18.4804 6 18.7348 6 19C6 19.2652 5.89464 19.5196 5.70711 19.7071C5.51957 19.8947 5.26522 20 5 20Z"/>
</svg>`,
      rotaPrescindeDeChave: true,
      presenteNoMenu: true,
      pesoNoMenu: 2,
      limitarÀsPermissões: ['CadastroPS.', 'CadastroMetaPS.listar'],
    },
    children: [
      {
        name: `${entidadeMãe}.planosSetoriaisListar`,
        path: '',
        component: () => import('@/views/planosSetoriais/PlanosSetoriaisLista.vue'),
        meta: {
          // não entendi o motivo dessa rota não herdar a propriedade `meta` da mãe
          limitarÀsPermissões: ['CadastroPS.', 'CadastroMetaPS.listar'],
        },
      },
      {
        name: `${entidadeMãe}.planosSetoriaisCriar`,
        path: 'novo',
        component: () => import('@/views/planosSetoriais/PlanosSetoriaisCriarEditar.vue'),
        meta: {
          limitarÀsPermissões: [
            'CadastroPS.administrador',
            'CadastroPS.administrador_no_orgao',
          ],
          rotaDeEscape: `${entidadeMãe}.planosSetoriaisListar`,
          rotasParaMigalhasDePão: [`${entidadeMãe}.planosSetoriaisListar`],
          título: `Cadastro de ${tituloEntidade.singular}`,
        },
      },
      {
        path: ':planoSetorialId',
        props: ({ params }) => ({
          ...params,
          planoSetorialId:
            Number.parseInt(params.planoSetorialId, 10) || undefined,
        }),
        meta: {
          rotasParaMenuSecundário: () => {
            const rotas = [
              `${entidadeMãe}.planosSetoriaisResumo`,
              `${entidadeMãe}.planosSetoriaisDocumentos`,
            ];

            if (
              usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.possui_macro_tema
            ) {
              rotas.push(`${entidadeMãe}.planosSetoriaisMacrotemas`);
            }
            if (usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.possui_tema) {
              rotas.push(`${entidadeMãe}.planosSetoriaisTemas`);
            }
            if (usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.possui_sub_tema) {
              rotas.push(`${entidadeMãe}.planosSetoriaisSubtemas`);
            }
            rotas.push('planoSetorial:listaDeMetas');
            rotas.push(`${entidadeMãe}.planosSetoriaisTags`);
            return rotas;
          },
          rotasParaMigalhasDePão: [`${entidadeMãe}.planosSetoriaisListar`],
        },
        component: () => import('@/views/planosSetoriais/PlanosSetoriaisItem.vue'),
        children: [
          {
            path: '',
            name: `${entidadeMãe}.planosSetoriaisEditar`,
            component: () => import('@/views/planosSetoriais/PlanosSetoriaisCriarEditar.vue'),
            props: ({ params }) => ({
              ...params,
              planoSetorialId:
                Number.parseInt(params.planoSetorialId, 10) || undefined,
            }),
            meta: {
              limitarÀsPermissões: [
                'CadastroPS.administrador',
                'CadastroPS.administrador_no_orgao',
              ],
              rotaDeEscape: `${entidadeMãe}.planosSetoriaisListar`,
              título: `Editar ${tituloEntidade.singular}`,
            },
          },
          {
            path: 'resumo',
            name: `${entidadeMãe}.planosSetoriaisResumo`,
            component: () => import('@/views/planosSetoriais/PlanosSetoriaisResumo.vue'),
            props: ({ params }) => ({
              ...params,
              planoSetorialId:
                Number.parseInt(params.planoSetorialId, 10) || undefined,
            }),
            meta: {
              título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.nome
                || `Resumo de ${tituloEntidade.singular}`,
              títuloParaMenu: 'Resumo',
            },
          },
          {
            path: 'documentos',
            name: `${entidadeMãe}.planosSetoriaisDocumentos`,
            component: () => import('@/views/planosSetoriais/PlanosSetoriaisDocumentos.vue'),
            props: ({ params }) => ({
              ...params,
              planoSetorialId:
                Number.parseInt(params.planoSetorialId, 10) || undefined,
            }),
            meta: {
              título: `Documentos de ${tituloEntidade.singular}`,
              títuloParaMenu: 'Documentos',
            },
            children: [
              {
                path: 'novo',
                name: `${entidadeMãe}.planosSetoriaisNovoDocumento`,
                component: () => import(
                  '@/views/planosSetoriais/PlanosSetoriaisEnviarArquivo.vue'
                ),
                meta: {
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisDocumentos`,
                  títuloParaMenu: 'Novo documento',
                },
              },
              {
                path: ':arquivoId',
                name: `${entidadeMãe}.planosSetoriaisEditarDocumento`,
                component: () => import(
                  '@/views/planosSetoriais/PlanosSetoriaisEnviarArquivo.vue'
                ),
                props: ({ params }) => ({
                  ...params,
                  ...{
                    arquivoId:
                      Number.parseInt(params.arquivoId, 10) || undefined,
                  },
                }),
                meta: {
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisDocumentos`,
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
                name: `${entidadeMãe}.planosSetoriaisTags`,
                component: () => import('@/views/ps.tags/TagsLista.vue'),
                meta: {
                  título: 'Tags',
                },
              },
              {
                path: 'novo',
                name: `${entidadeMãe}.novaTag`,
                component: () => import('@/views/ps.tags/TagsCriarEditar.vue'),
                meta: {
                  título: 'Nova Tag',
                  limitarÀsPermissões: ['CadastroTagPS.inserir'],
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisTags`,
                },
              },
              {
                path: ':tagId',
                name: `${entidadeMãe}.editarTag`,
                component: () => import('@/views/ps.tags/TagsCriarEditar.vue'),
                props: ({ params }) => ({
                  ...params,
                  ...{ tagId: Number.parseInt(params.tagId, 10) || undefined },
                }),
                meta: {
                  título: 'Editar Tag',
                  limitarÀsPermissões: ['CadastroTagPS.editar'],
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisTags`,
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
                name: `${entidadeMãe}.planosSetoriaisMacrotemas`,
                component: () => import('@/views/ps.macrotemas/MacrotemasLista.vue'),
                meta: {
                  título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                    ?.rotulo_macro_tema || 'Macrotema',
                },
              },
              {
                path: 'novo',
                name: `${entidadeMãe}.novoMacrotema`,
                component: () => import('@/views/ps.macrotemas/MacrotemasCriarEditar.vue'),
                meta: {
                  título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                    ?.rotulo_macro_tema || 'Novo Macrotema',
                  limitarÀsPermissões: ['CadastroMacroTemaPS.inserir'],
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisMacrotemas`,
                },
              },
              {
                path: ':macrotemaId',
                name: `${entidadeMãe}.editarMacrotema`,
                component: () => import('@/views/ps.macrotemas/MacrotemasCriarEditar.vue'),
                props: ({ params }) => ({
                  ...params,
                  ...{
                    macrotemaId:
                      Number.parseInt(params.macrotemaId, 10) || undefined,
                  },
                }),
                meta: {
                  título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                    ?.rotulo_macro_tema || 'Editar Macrotema',
                  limitarÀsPermissões: ['CadastroMacroTemaPS.editar'],
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisMacrotemas`,
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
                name: `${entidadeMãe}.planosSetoriaisTemas`,
                component: () => import('@/views/ps.temas/TemasLista.vue'),
                meta: {
                  título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.rotulo_tema
                    || 'Tema',
                },
              },
              {
                path: 'novo',
                name: `${entidadeMãe}.planosSetoriaisNovoTema`,
                component: () => import('@/views/ps.temas/TemasCriarEditar.vue'),
                meta: {
                  título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.rotulo_tema
                    || 'Novo Tema',
                  limitarÀsPermissões: ['CadastroTemaPS.inserir'],
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisTemas`,
                },
              },
              {
                path: ':temaId',
                name: `${entidadeMãe}.planosSetoriaisEditarTema`,
                component: () => import('@/views/ps.temas/TemasCriarEditar.vue'),
                props: ({ params }) => ({
                  ...params,
                  ...{
                    temaId: Number.parseInt(params.temaId, 10) || undefined,
                  },
                }),
                meta: {
                  título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.rotulo_tema
                    || 'Editar Tema',
                  limitarÀsPermissões: ['CadastroTemaPS.editar'],
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisTemas`,
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
                name: `${entidadeMãe}.planosSetoriaisSubtemas`,
                component: () => import('@/views/ps.subtemas/SubtemasLista.vue'),
                meta: {
                  título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                    ?.rotulo_sub_tema || 'Subtema',
                },
              },
              {
                path: 'novo',
                name: `${entidadeMãe}.planosSetoriaisNovoSubtema`,
                component: () => import('@/views/ps.subtemas/SubtemasCriarEditar.vue'),
                meta: {
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisSubtemas`,
                  título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                    ?.rotulo_sub_tema || 'Novo Subtema',
                  limitarÀsPermissões: ['CadastroSubTemaPS.inserir'],
                },
              },
              {
                path: ':subtemaId',
                name: `${entidadeMãe}.planosSetoriaisEditarSubtema`,
                component: () => import('@/views/ps.subtemas/SubtemasCriarEditar.vue'),
                props: ({ params }) => ({
                  ...params,
                  ...{
                    subtemaId:
                      Number.parseInt(params.subtemaId, 10) || undefined,
                  },
                }),
                meta: {
                  título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                    ?.rotulo_sub_tema || 'Editar Subtema',
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisSubtemas`,
                  limitarÀsPermissões: ['CadastroSubTemaPS.editar'],
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

              título: () => `Metas de ${
                usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.nome
                  || tituloEntidade.singular
              }`,
              títuloParaMenu: 'Metas',
              desabilitarMigalhasDePãoPadrão: true,
            },

            children: metas,
          },
        ],
      },
    ],
  };
}

export default prepararRotasParaProgramaDeMetas;
