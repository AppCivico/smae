/**
 * Configuração centralizada para funcionalidades de etapas
 * Mapeia entidadeMãe para rotas e permissões correspondentes
 */

const configEtapas = {
  projeto: {
    rotaPrefix: 'projeto.etapas',
    permissões: {
      editar: 'CadastroProjetoEtapa.editar',
      inserir: 'CadastroProjetoEtapa.inserir',
      remover: 'CadastroProjetoEtapa.remover',
    },
    requerPermissão: true,
  },
  mdo: {
    rotaPrefix: 'mdo.etapas',
    permissões: {
      editar: 'CadastroProjetoEtapaMDO.editar',
      inserir: 'CadastroProjetoEtapaMDO.inserir',
      remover: 'CadastroProjetoEtapaMDO.remover',
    },
    requerPermissão: true,
  },
  obras: {
    rotaPrefix: 'mdo.etapas',
    permissões: {
      editar: 'CadastroProjetoEtapaMDO.editar',
      inserir: 'CadastroProjetoEtapaMDO.inserir',
      remover: 'CadastroProjetoEtapaMDO.remover',
    },
    requerPermissão: true,
  },
  TransferenciasVoluntarias: {
    rotaPrefix: 'TransferenciasVoluntarias',
    permissões: {
      editar: null,
      inserir: null,
      remover: null,
    },
    requerPermissão: false,
  },
};

export default configEtapas;
