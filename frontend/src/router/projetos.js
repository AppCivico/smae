import MenuSecundario from '@/components/MenuSecundario.vue';
import ProjetosCriarEditar from '@/views/projetos/ProjetosCriarEditar.vue';
import ProjetosLista from '@/views/projetos/ProjetosLista.vue';
import ProjetosRaiz from '@/views/projetos/ProjetosRaiz.vue';

export default {
  path: '/projetos',
  component: ProjetosRaiz,
  props: {
    submenu: MenuSecundario,
  },

  meta: {
    requerAutenticação: true,

    presenteNoMenu: true,
    títuloParaMenu: 'Projetos',
    íconeParaMenu: `<svg width="18" height="22" viewBox="0 0 18 22">
    </svg>`,
    restringirÀsPermissões: [
      'Projeto.administrador',
      'SMAE.gestor_de_projeto',
      'SMAE.colaborador_de_projeto',
    ],
  },
  children: [
    {
      name: 'projetosListar',
      path: '',
      component: ProjetosLista,
      meta: {
        título: 'Projetos',
      },
    },
    {
      name: 'projetosCriar',
      path: 'novo',
      component: ProjetosCriarEditar,
      meta: {
        presenteNoMenu: true,
        título: 'Novo projeto',
      },
    },
    {
      path: ':projetoId',
      name: 'projetosEditar',
      component: ProjetosCriarEditar,
      props: ({ params }) => ({
        ...params,
        ...{ projetoId: Number.parseInt(params.projetoId, 10) || undefined },
      }),

      meta: {
        título: 'Editar projeto',
      },
    },
  ],
};
