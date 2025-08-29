import type { RouteLocation } from 'vue-router';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import tiparPropsDeRota from '../helpers/tiparPropsDeRota';
import metasRoutes from './metas.routes';

const ListaDeRelatorios = () => import('@/views/relatorios/ListaDeRelatorios.vue');

export type EntidadesPossiveis = 'planoSetorial' | 'programaDeMetas';
export type ParametrosPagina = {
  tituloSingular: string;
  tituloPlural: string;
  segmentoRaiz: string;
  privilegioRaiz: string[] | string;
  privilegiosParaRelatorio: string[] | string;
};

function getParametrosPagina(entidadeMãe: EntidadesPossiveis): ParametrosPagina {
  switch (entidadeMãe) {
    case 'planoSetorial':
      return {
        tituloSingular: 'Plano Setorial',
        tituloPlural: 'Planos Setoriais',
        segmentoRaiz: '/plano-setorial',
        privilegioRaiz: [
          'CadastroPS.',
          'ReferencialEm.Equipe.PS',
        ],
        privilegiosParaRelatorio: [
          'Reports.executar.PlanoSetorial',
        ],
      };

    case 'programaDeMetas':
      return {
        tituloSingular: 'Programa de Meta',
        tituloPlural: 'Programa de Metas',
        segmentoRaiz: '/programa-de-meta',
        privilegioRaiz: [
          'CadastroPDM.',
          'ReferencialEm.Equipe.ProgramaDeMetas',
        ],
        privilegiosParaRelatorio: [
          'Reports.executar.ProgramaDeMetas',
        ],
      };

    default:
      throw new Error(`Entidade mãe "${entidadeMãe}" não encontrada`);
  }
}

function prepararRotasParaProgramaDeMetas(entidadeMãe: EntidadesPossiveis) {
  const parametrosPagina = getParametrosPagina(entidadeMãe);

  return {
    path: parametrosPagina.segmentoRaiz,
    component: () => import('@/views/planosSetoriais/PlanosSetoriaisRaiz.vue'),

    meta: {
      título: parametrosPagina.tituloPlural,
      tituloSingular: parametrosPagina.tituloSingular,
      tituloPlural: parametrosPagina.tituloPlural,
      entidadeMãe,
      íconeParaMenu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<circle cx="5" cy="19" r="2" fill="#152741"/>
<path d="M18 11H14.82C14.4 9.84 13.3 9 12 9C10.7 9 9.6 9.84 9.18 11H6C5.67 11 4 10.9 4 9V8.00001C4 6.17001 5.54 6.00001 6 6.00001H16.18V8.37004L21.5 4.99999L16.18 1.68481C16.18 1.68481 16.18 2.278 16.18 4.00001H6C4.39 4.00001 2 5.06001 2 8.00001V9C2 11.94 4.39 13 6 13H9.18C9.6 14.16 10.7 15 12 15C13.3 15 14.4 14.16 14.82 13H18C18.33 13 20 13.1 20 15V16C20 17.83 18.46 18 18 18H7.82C7.4 16.84 6.3 16 5 16C4.20435 16 3.44129 16.3161 2.87868 16.8787C2.31607 17.4413 2 18.2044 2 19C2 19.7957 2.31607 20.5587 2.87868 21.1213C3.44129 21.6839 4.20435 22 5 22C6.3 22 7.4 21.16 7.82 20H18C19.61 20 22 18.93 22 16V15C22 12.07 19.61 11 18 11ZM5 20C4.73478 20 4.48043 19.8947 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19C4 18.7348 4.10536 18.4804 4.29289 18.2929C4.48043 18.1054 4.73478 18 5 18C5.26522 18 5.51957 18.1054 5.70711 18.2929C5.89464 18.4804 6 18.7348 6 19C6 19.2652 5.89464 19.5196 5.70711 19.7071C5.51957 19.8947 5.26522 20 5 20Z"/>
</svg>`,
      rotaPrescindeDeChave: true,
      limitarÀsPermissões: parametrosPagina.privilegioRaiz,
    },
    children: [
      {
        path: 'consulta-geral',
        component: () => import('@/views/planosSetoriais/PlanosSetoriaisLista.vue'),
        name: 'consultaGeral',
        meta: {
          título: 'consulta geral',
          tituloSingular: 'consulta geral',
          tituloPlural: 'consulta geral',
          íconeParaMenu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M16 15C17.306 15 18.418 15.835 18.83 17H20C20.2652 17 20.5196 17.1054 20.7071 17.2929C20.8946 17.4804 21 17.7348 21 18C21 18.2652 20.8946 18.5196 20.7071 18.7071C20.5196 18.8946 20.2652 19 20 19H18.83C18.6234 19.5855 18.2403 20.0926 17.7334 20.4512C17.2265 20.8099 16.6209 21.0025 16 21.0025C15.3791 21.0025 14.7735 20.8099 14.2666 20.4512C13.7597 20.0926 13.3766 19.5855 13.17 19H4C3.73478 19 3.48043 18.8946 3.29289 18.7071C3.10536 18.5196 3 18.2652 3 18C3 17.7348 3.10536 17.4804 3.29289 17.2929C3.48043 17.1054 3.73478 17 4 17H13.17C13.377 16.4149 13.7603 15.9084 14.2671 15.5502C14.774 15.1921 15.3794 14.9998 16 15ZM16 17C15.7348 17 15.4804 17.1054 15.2929 17.2929C15.1054 17.4804 15 17.7348 15 18C15 18.2652 15.1054 18.5196 15.2929 18.7071C15.4804 18.8946 15.7348 19 16 19C16.2652 19 16.5196 18.8946 16.7071 18.7071C16.8946 18.5196 17 18.2652 17 18C17 17.7348 16.8946 17.4804 16.7071 17.2929C16.5196 17.1054 16.2652 17 16 17ZM8 9C8.58899 8.99992 9.16497 9.17322 9.65613 9.49829C10.1473 9.82336 10.5319 10.2858 10.762 10.828L10.829 11H20C20.2549 11.0003 20.5 11.0979 20.6854 11.2728C20.8707 11.4478 20.9822 11.687 20.9972 11.9414C21.0121 12.1958 20.9293 12.4464 20.7657 12.6418C20.6021 12.8373 20.3701 12.9629 20.117 12.993L20 13H10.83C10.6284 13.5703 10.2592 14.0663 9.77073 14.4231C9.28229 14.7799 8.69744 14.9808 8.09285 14.9994C7.48827 15.018 6.89217 14.8534 6.38273 14.5273C5.87328 14.2012 5.47427 13.7288 5.238 13.172L5.17 13H4C3.74512 12.9997 3.49997 12.9021 3.31463 12.7272C3.1293 12.5522 3.01777 12.313 3.00283 12.0586C2.98789 11.8042 3.07067 11.5536 3.23426 11.3582C3.39786 11.1627 3.6299 11.0371 3.883 11.007L4 11H5.17C5.37701 10.4149 5.76032 9.90842 6.26715 9.55024C6.77397 9.19206 7.37938 8.99982 8 9ZM8 11C7.73478 11 7.48043 11.1054 7.29289 11.2929C7.10536 11.4804 7 11.7348 7 12C7 12.2652 7.10536 12.5196 7.29289 12.7071C7.48043 12.8946 7.73478 13 8 13C8.26522 13 8.51957 12.8946 8.70711 12.7071C8.89464 12.5196 9 12.2652 9 12C9 11.7348 8.89464 11.4804 8.70711 11.2929C8.51957 11.1054 8.26522 11 8 11ZM16 3C17.306 3 18.418 3.835 18.83 5H20C20.2652 5 20.5196 5.10536 20.7071 5.29289C20.8946 5.48043 21 5.73478 21 6C21 6.26522 20.8946 6.51957 20.7071 6.70711C20.5196 6.89464 20.2652 7 20 7H18.83C18.6234 7.58553 18.2403 8.09257 17.7334 8.45121C17.2265 8.80985 16.6209 9.00245 16 9.00245C15.3791 9.00245 14.7735 8.80985 14.2666 8.45121C13.7597 8.09257 13.3766 7.58553 13.17 7H4C3.73478 7 3.48043 6.89464 3.29289 6.70711C3.10536 6.51957 3 6.26522 3 6C3 5.73478 3.10536 5.48043 3.29289 5.29289C3.48043 5.10536 3.73478 5 4 5H13.17C13.377 4.41493 13.7603 3.90842 14.2671 3.55024C14.774 3.19206 15.3794 2.99982 16 3ZM16 5C15.7348 5 15.4804 5.10536 15.2929 5.29289C15.1054 5.48043 15 5.73478 15 6C15 6.26522 15.1054 6.51957 15.2929 6.70711C15.4804 6.89464 15.7348 7 16 7C16.2652 7 16.5196 6.89464 16.7071 6.70711C16.8946 6.51957 17 6.26522 17 6C17 5.73478 16.8946 5.48043 16.7071 5.29289C16.5196 5.10536 16.2652 5 16 5Z" fill="currentColor"/>
        </svg>`,
        },
      },
      {
        name: `${entidadeMãe}.planosSetoriaisListar`,
        path: '',
        component: () => import('@/views/planosSetoriais/PlanosSetoriaisLista.vue'),
      },
      {
        name: `${entidadeMãe}.quadroDeAtividades`,
        path: 'quadro-de-atividades',
        component: () => import('@/views/planosSetoriais/PlanosSetoriaisQuadroDeAtividades.vue'),
        meta: {
          titulo: 'Quadro de atividades',
          limitarÀsPermissões: [
            'ReferencialEm.Equipe.ProgramaDeMetas',
            'ReferencialEm.Equipe.PS',
            'ReferencialEm.EquipeBanco.ProgramaDeMetas',
            'ReferencialEm.EquipeBanco.PS',
            'SMAE.GrupoVariavel.participante',
          ],
        },
      },
      {
        name: `${entidadeMãe}.planosSetoriaisCriar`,
        path: 'novo',
        component: () => import('@/views/planosSetoriais/PlanosSetoriaisCriarEditar.vue'),
        meta: {
          limitarÀsPermissões: [
            'CadastroPS.administrador',
            'CadastroPDM.administrador',
            'CadastroPS.administrador_no_orgao',
            'CadastroPDM.administrador_no_orgao',
          ],
          rotaDeEscape: `${entidadeMãe}.planosSetoriaisListar`,
          rotasParaMigalhasDePão: [`${entidadeMãe}.planosSetoriaisListar`],
          título: `Cadastro de ${parametrosPagina.tituloSingular}`,
        },
      },
      {
        path: ':planoSetorialId',
        component: () => import('@/views/planosSetoriais/PlanosSetoriaisItem.vue'),
        props: tiparPropsDeRota,
        meta: {
          rotasParaMenuSecundário: () => {
            const rotasParaMenu = [
              `${entidadeMãe}.planosSetoriaisResumo`,
              `${entidadeMãe}.planosSetoriaisDocumentos`,
            ];

            if (
              usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.possui_macro_tema
            ) {
              rotasParaMenu.push(`${entidadeMãe}.planosSetoriaisMacrotemas`);
            }
            if (usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.possui_tema) {
              rotasParaMenu.push(`${entidadeMãe}.planosSetoriaisTemas`);
            }
            if (usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.possui_sub_tema) {
              rotasParaMenu.push(`${entidadeMãe}.planosSetoriaisSubtemas`);
            }
            rotasParaMenu.push(`${entidadeMãe}.listaDeMetas`);
            rotasParaMenu.push(`${entidadeMãe}.planosSetoriaisTags`);
            return rotasParaMenu;
          },
          rotasParaMigalhasDePão: [`${entidadeMãe}.planosSetoriaisListar`],
        },
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
                'CadastroPDM.administrador',
                'CadastroPS.administrador_no_orgao',
                'CadastroPDM.administrador_no_orgao',
              ],
              rotaDeEscape: `${entidadeMãe}.planosSetoriaisListar`,
              título: `Editar ${parametrosPagina.tituloSingular}`,
            },
          },
          {
            path: 'permissoes-orcamento',
            name: `${entidadeMãe}.permissoesOrcamento`,
            component: () => import('@/views/planosSetoriais/EdicaoOrcamento/EdicaoOrcamento.vue'),
            meta: {
              limitarÀsPermissões: [
                'CadastroPS.administrador',
                'CadastroPDM.administrador',
                'CadastroPS.administrador_no_orgao',
                'CadastroPDM.administrador_no_orgao',
              ],
              rotaDeEscape: `${entidadeMãe}.planosSetoriaisListar`,
              título: `Permissões para edição do orçamento de ${parametrosPagina.tituloSingular}`,
            },
          },
          {
            path: 'resumo',
            name: `${entidadeMãe}.planosSetoriaisResumo`,
            component: () => import('@/views/planosSetoriais/PlanosSetoriaisResumo.vue'),
            props: tiparPropsDeRota,
            meta: {
              título: () => usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.nome
                || `Resumo de ${parametrosPagina.tituloSingular}`,
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
              título: `Documentos de ${parametrosPagina.tituloSingular}`,
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
                  planoSetorialId:
                Number.parseInt(params.planoSetorialId, 10) || undefined,
                  arquivoId:
                      Number.parseInt(params.arquivoId, 10) || undefined,
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
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisTags`,
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.planosSetoriaisListar`,
                    `${entidadeMãe}.planosSetoriaisTags`,
                  ],
                },
              },
              {
                path: ':tagId',
                name: `${entidadeMãe}.editarTag`,
                component: () => import('@/views/ps.tags/TagsCriarEditar.vue'),
                props: ({ params }) => ({
                  ...params,
                  planoSetorialId:
                Number.parseInt(params.planoSetorialId, 10) || undefined,
                  tagId: Number.parseInt(params.tagId, 10) || undefined,
                }),
                meta: {
                  título: 'Editar Tag',
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisTags`,
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.planosSetoriaisListar`,
                    `${entidadeMãe}.planosSetoriaisTags`,
                  ],
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
                  título: () => {
                    const tituloEntidade = usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                      ?.rotulo_macro_tema || 'Macrotema';

                    return `Novo ${tituloEntidade}`;
                  },
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisMacrotemas`,
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.planosSetoriaisListar`,
                    `${entidadeMãe}.planosSetoriaisMacrotemas`,
                  ],
                },
              },
              {
                path: ':macrotemaId',
                name: `${entidadeMãe}.editarMacrotema`,
                component: () => import('@/views/ps.macrotemas/MacrotemasCriarEditar.vue'),
                props: ({ params }) => ({
                  ...params,
                  planoSetorialId:
                Number.parseInt(params.planoSetorialId, 10) || undefined,
                  macrotemaId:
                      Number.parseInt(params.macrotemaId, 10) || undefined,
                }),
                meta: {
                  título: () => {
                    const tituloEntidade = usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                      ?.rotulo_macro_tema || 'Macrotema';

                    return `Editar ${tituloEntidade}`;
                  },
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisMacrotemas`,
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.planosSetoriaisListar`,
                    `${entidadeMãe}.planosSetoriaisMacrotemas`,
                  ],
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
                  título: () => {
                    const tituloEntidade = usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                      ?.rotulo_tema || 'Tema';

                    return `Nova ${tituloEntidade}`;
                  },
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisTemas`,
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.planosSetoriaisListar`,
                    `${entidadeMãe}.planosSetoriaisTemas`,
                  ],
                },
              },
              {
                path: ':temaId',
                name: `${entidadeMãe}.planosSetoriaisEditarTema`,
                component: () => import('@/views/ps.temas/TemasCriarEditar.vue'),
                props: ({ params }) => ({
                  ...params,
                  planoSetorialId:
                    Number.parseInt(params.planoSetorialId, 10) || undefined,
                  temaId: Number.parseInt(params.temaId, 10) || undefined,
                }),
                meta: {
                  título: () => {
                    const tituloEntidade = usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                      ?.rotulo_tema || 'Tema';

                    return `Editar ${tituloEntidade}`;
                  },
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisTemas`,
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.planosSetoriaisListar`,
                    `${entidadeMãe}.planosSetoriaisTemas`,
                  ],
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
                  título: () => {
                    const tituloEntidade = usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                      ?.rotulo_sub_tema || 'Subtema';

                    return `Novo ${tituloEntidade}`;
                  },
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.planosSetoriaisListar`,
                    `${entidadeMãe}.planosSetoriaisSubtemas`,
                  ],
                },
              },
              {
                path: ':subtemaId',
                name: `${entidadeMãe}.planosSetoriaisEditarSubtema`,
                component: () => import('@/views/ps.subtemas/SubtemasCriarEditar.vue'),
                props: ({ params }) => ({
                  ...params,
                  planoSetorialId:
                Number.parseInt(params.planoSetorialId, 10) || undefined,
                  subtemaId:
                      Number.parseInt(params.subtemaId, 10) || undefined,
                }),
                meta: {
                  título: () => {
                    const tituloEntidade = usePlanosSetoriaisStore(entidadeMãe)?.emFoco
                      ?.rotulo_sub_tema || 'Subtema';

                    return `Editar ${tituloEntidade}`;
                  },
                  rotaDeEscape: `${entidadeMãe}.planosSetoriaisSubtemas`,
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.planosSetoriaisListar`,
                    `${entidadeMãe}.planosSetoriaisSubtemas`,
                  ],
                },
              },
            ],
          },
          {
            path: 'metas',
            props: ({ params }) => ({
              ...params,
              planoSetorialId:
                Number.parseInt(params.planoSetorialId, 10) || undefined,
            }),
            component: () => import('@/views/planosSetoriais/PlanoSetoriaisMetas.vue'),

            meta: {
              // possível apenas porque os valores to tipo `function` são
              // executados no guarda `router.beforeEach()`.Veja `/router/index`.
              prefixoDosCaminhos: (route: RouteLocation) => `${parametrosPagina.segmentoRaiz}/${route.params.planoSetorialId}`,

              título: () => `Metas de ${
                usePlanosSetoriaisStore(entidadeMãe)?.emFoco?.nome
                  || parametrosPagina.tituloSingular
              }`,
              títuloParaMenu: 'Metas',
              desabilitarMigalhasDePãoPadrão: true,
              limitarÀsPermissões: undefined,
            },

            children: metasRoutes({ entidadeMãe, parametrosPagina }),
          },
        ],
      },
      {
        path: 'relatorios',
        meta: {
          desabilitarMigalhasDePãoPadrão: false,
          limitarÀsPermissões: parametrosPagina.privilegiosParaRelatorio,
        },
        children: [
          {
            path: 'mensal',
            component: () => import('@/views/relatorios/planosSetoriais/RelatoriosMensaisRaizPS.vue'),
            meta: {
              título: 'Relatórios Mensais',
              títuloParaMenu: undefined,
              fonteDoRelatorio: 'PSMonitoramentoMensal',
            },
            children: [
              {
                path: '',
                name: `${entidadeMãe}.RelatóriosMensais`,
                component: ListaDeRelatorios,
                meta: {
                  rotaNovoRelatorio: `${entidadeMãe}.novoRelatórioMensal`,
                },
              },
              {
                component: () => import('@/views/relatorios/planosSetoriais/NovoMensalPS.vue'),
                path: 'novo',
                name: `${entidadeMãe}.novoRelatórioMensal`,
                meta: {
                  título: 'Novo relatório mensal',
                  rotaDeEscape: `${entidadeMãe}.RelatóriosMensais`,
                  rotasParaMigalhasDePão: [`${entidadeMãe}.RelatóriosMensais`],
                },
              },
            ],
          },

          {
            path: 'semestral-ou-anual',
            meta: {
              título: 'Relatórios Semestrais e Anuais',
              títuloParaMenu: undefined,
              fonteDoRelatorio: 'PSIndicadores',
            },

            children: [
              {
                path: '',
                name: `${entidadeMãe}.RelatóriosSemestraisOuAnuais`,
                component: ListaDeRelatorios,
                meta: {
                  rotaNovoRelatorio: `${entidadeMãe}.novoRelatórioSemestralOuAnual`,
                },
              },
              {
                path: 'novo',
                name: `${entidadeMãe}.novoRelatórioSemestralOuAnual`,
                component: () => import('@/views/relatorios/NovoSemestralOuAnual.vue'),
                meta: {
                  título: 'Novo relatório semestral ou anual',
                  rotaDeEscape: `${entidadeMãe}.RelatóriosSemestraisOuAnuais`,
                  rotasParaMigalhasDePão: [`${entidadeMãe}.RelatóriosSemestraisOuAnuais`],
                },
              },
            ],
          },

          {
            path: 'previsao-de-custo',
            meta: {
              título: 'Relatórios de previsão de custo',
              títuloParaMenu: undefined,
              fonteDoRelatorio: 'PSPrevisaoCusto',
            },
            children: [
              {
                path: '',
                name: `${entidadeMãe}.RelatóriosDePrevisãoDeCustoPlanosSetoriais`,
                component: ListaDeRelatorios,
                meta: {
                  rotaNovoRelatorio: `${entidadeMãe}.novoRelatórioDePrevisãoDeCustoPlanosSetoriais`,
                },
              },
              {
                path: 'novo',
                name: `${entidadeMãe}.novoRelatórioDePrevisãoDeCustoPlanosSetoriais`,
                component: () => import('@/views/relatorios/NovoRelatorioDePrevisaoDeCustoPlanosSetoriais.vue'),
                meta: {
                  rotaDeEscape: `${entidadeMãe}.RelatóriosDePrevisãoDeCustoPlanosSetoriais`,
                  título: 'Novo relatório de previsão de custo',
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.RelatóriosDePrevisãoDeCustoPlanosSetoriais`,
                  ],
                },
              },
            ],
          },

          {
            path: 'orcamentarios',
            meta: {
              título: 'Relatórios orçamentários',
              títuloParaMenu: undefined,
              fonteDoRelatorio: 'PSOrcamento',
            },
            children: [
              {
                path: '',
                name: `${entidadeMãe}.RelatóriosOrçamentáriosPlanosSetoriais`,
                component: ListaDeRelatorios,
                meta: {
                  rotaNovoRelatorio: `${entidadeMãe}.novoRelatórioOrçamentárioPlanosSetoriais`,
                },
              },
              {
                path: 'novo',
                name: `${entidadeMãe}.novoRelatórioOrçamentárioPlanosSetoriais`,
                component: () => import('@/views/relatorios/NovoRelatorioOrcamentarioPlanosSetoriais.vue'),
                meta: {
                  título: 'Novo relatório orçamentário',
                  rotaDeEscape: `${entidadeMãe}.RelatóriosOrçamentáriosPlanosSetoriais`,
                  rotasParaMigalhasDePão: [
                    `${entidadeMãe}.RelatóriosOrçamentáriosPlanosSetoriais`,
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

export default prepararRotasParaProgramaDeMetas;
