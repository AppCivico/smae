import { useContratosStore } from '@/stores/contratos.store';
import ContratosCriarEditar from '@/views/mdo.contratos/ContratosCriarEditar.vue';

export default function projetosContratos(entidadeMãe) {
  function obterContratoEmFoco() {
    return useContratosStore(entidadeMãe).emFoco;
  }

  return {
    path: 'contratos',
    component: () => import('@/views/mdo.contratos/ContratosRaiz.vue'),
    props: true,
    children: [
      {
        name: 'contratosDoProjetoListar',
        path: '',
        component: () => import('@/views/mdo.contratos/ContratosLista.vue'),
        meta: {
          título: 'Contratos',
          títuloParaMenu: 'Contratos',
          rotasParaMigalhasDePão: [
            'projetosListar',
            'projetosResumo',
          ],
        },
        props: true,
      },

      {
        name: 'contratosDoProjetoCriar',
        path: 'novo',
        component: ContratosCriarEditar,
        meta: {
          título: 'Novo contrato',
          títuloParaMenu: 'Novo contrato',
          tituloParaMigalhaDePao: 'Novo',
          rotaDeEscape: 'contratosDoProjetoListar',
          rotasParaMigalhasDePão: [
            'projetosListar',
            'projetosResumo',
            'contratosDoProjetoListar',
          ],
        },
      },

      {
        path: ':contratoId',
        component: () => import('@/views/mdo.contratos/ContratosItem.vue'),
        props: true,

        children: [
          {
            path: '',
            name: 'contratosDoProjetoEditar',
            component: ContratosCriarEditar,
            props: true,

            meta: {
              títuloParaMenu: 'Editar contrato',
              título: () => obterContratoEmFoco()?.numero || 'Editar contrato',
              rotaDeEscape: 'contratosDoProjetoListar',
              rotasParaMigalhasDePão: [
                'projetosListar',
                'projetosResumo',
                'contratosDoProjetoListar',
                'contratosDoProjetoResumo',
              ],
            },
          },

          {
            path: 'resumo',
            name: 'contratosDoProjetoResumo',
            component: () => import('@/views/mdo.contratos/ContratosResumo.vue'),
            props: true,
            meta: {
              título: () => obterContratoEmFoco()?.numero || 'Resumo de contrato',
              tituloParaMigalhaDePao: () => obterContratoEmFoco()?.numero || 'Resumo de contrato',
              títuloParaMenu: 'Resumo',
              rotasParaMigalhasDePão: [
                'projetosListar',
                'projetosResumo',
                'contratosDoProjetoListar',
              ],
            },
          },
        ],
      },
    ],
  };
}
