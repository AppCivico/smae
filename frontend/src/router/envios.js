import LoadingComponent from '@/components/LoadingComponent.vue';
import MenuSecundário from '@/components/MenuSecundario.vue';
import EnviosRaiz from '@/views/envios/EnviosRaiz.vue';
import { defineAsyncComponent } from 'vue';

const DialogWrapper = defineAsyncComponent({
  loader: () => import('@/views/DialogWrapper.vue'),
  loadingComponent: LoadingComponent,
});
const EnviarArquivo = defineAsyncComponent({
  loader: () => import('@/views/envios/EnviarArquivo.vue'),
  loadingComponent: LoadingComponent,
});
const EnviosLista = defineAsyncComponent({
  loader: () => import('@/views/envios/EnviosLista.vue'),
  loadingComponent: LoadingComponent,
});
const EnviosMetas = defineAsyncComponent({
  loader: () => import('@/views/envios/EnviosMetas.vue'),
  loadingComponent: LoadingComponent,
});
const EnviosProjetos = defineAsyncComponent({
  loader: () => import('@/views/envios/EnviosProjetos.vue'),
  loadingComponent: LoadingComponent,
});

export default {
  path: '/envios',
  name: 'envios',
  component: EnviosRaiz,
  props: {
    submenu: MenuSecundário,
  },

  meta: {
    presenteNoMenu: true,
    título: 'Envio de arquivos',
    títuloParaMenu: 'Envio de arquivos',
    íconeParaMenu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<path d="M6.609 2.013A8.294 8.294 0 0 1 12 0c4.035 0 7.384 3 7.749 6.868C22.137 7.206 24 9.205 24 11.66c0 2.694-2.247 4.841-4.97 4.841H15a.754.754 0 0 1-.75-.75c0-.411.339-.75.75-.75h4.032c1.936 0 3.468-1.518 3.468-3.34 0-1.825-1.53-3.343-3.47-3.343h-.75v-.75C18.282 4.237 15.492 1.5 12 1.5a6.798 6.798 0 0 0-4.412 1.65C6.454 4.128 5.86 5.307 5.86 6.233v.671l-.668.074c-2.095.23-3.691 1.95-3.691 3.999C1.5 13.177 3.345 15 5.671 15H9c.411 0 .75.339.75.75s-.339.75-.75.75H5.671C2.563 16.5 0 14.049 0 10.977c0-2.645 1.899-4.835 4.413-5.39.214-1.294 1.047-2.584 2.196-3.574Z"/>
<path d="M11.469 6.219a.75.75 0 0 1 1.062 0l4.5 4.5a.75.75 0 1 1-1.062 1.062l-3.219-3.22V21.75c0 .411-.339.75-.75.75a.754.754 0 0 1-.75-.75V8.56l-3.219 3.221a.75.75 0 1 1-1.062-1.062l4.5-4.5Z"/>
</svg>`,
    pesoNoMenu: 5,
    limitarÀsPermissões: [
      'CadastroMeta.orcamento',
      'Projeto.orcamento',
    ],
    rotasParaMenuSecundário: [
      {
        título: 'Orçamentos',
        rotas: [
          'EnviosOrçamentosMetas',
          'EnviosOrçamentosProjetos',
        ],
      },
    ],
  },
  children: [
    {
      name: 'enviosOrçamentos',
      path: 'orcamentos',
      meta: {
        título: 'Envios ativos',
        títuloParaMenu: 'Ativos',
      },
    },
    {
      path: 'orcamentos/metas',
      component: EnviosMetas,
      meta: {
        título: 'Envio de orçamento para metas',
        títuloParaMenu: 'Metas',
        entidadeMãe: 'pdm',
        limitarÀsPermissões: [
          'CadastroMeta.orcamento',
        ],
      },
      children: [
        {
          path: '',
          name: 'EnviosOrçamentosMetas',
          component: EnviosLista,
        },
        {
          path: 'enviar',
          components: {
            default: EnviosLista,
            modal: DialogWrapper,
          },
          children: [
            {
              path: '',
              name: 'EnviosOrçamentosMetasNovo',
              component: EnviarArquivo,
              meta: {
                rotaDeEscape: 'EnviosOrçamentosMetas',
              },
            },
          ],
        },
      ],
    },
    {
      path: 'orcamentos/projetos',
      component: EnviosProjetos,
      meta: {
        título: 'Envio de orçamento para projetos',
        títuloParaMenu: 'Projetos',
        entidadeMãe: 'portfolio',
        limitarÀsPermissões: [
          'Projeto.orcamento',
        ],
      },
      children: [
        {
          path: '',
          name: 'EnviosOrçamentosProjetos',
          component: EnviosLista,
        },
        {
          path: 'enviar',
          components: {
            default: EnviosLista,
            modal: DialogWrapper,
          },
          children: [
            {
              path: '',
              name: 'EnviosOrçamentosProjetosNovo',
              component: EnviarArquivo,
              meta: {
                rotaDeEscape: 'EnviosOrçamentosProjetos',
              },
            },
          ],
        },
      ],
    },
  ],
};
