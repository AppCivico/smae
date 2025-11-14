/**
 * Configuração centralizada para funcionalidades de etapas
 * Mapeia entidadeMãe para rotas e permissões correspondentes
 *
 * contextoEtapa:
 * - 'administracao': Etapas padrão (eh_padrao = true)
 * - 'configuracoes': Etapas específicas de portfolio (eh_padrao = false)
 * - undefined/null: Ambos os tipos (comportamento padrão)
 *
 * rotasAdministracao: rotas usadas no contexto de administração (etapas padrão)
 * rotaPrefix: rotas usadas no contexto de configurações (etapas específicas)
 */

const configEtapas = {
  projeto: {
    rotaPrefix: 'projeto.etapas',
    rotasAdministracao: {
      listar: 'projeto.etapasListar',
      criar: 'projeto.etapaCriar',
      editar: 'projeto.etapaEditar',
    },
    permissões: {
      editar: 'CadastroProjetoEtapa.editar',
      inserir: 'CadastroProjetoEtapa.inserir',
      remover: 'CadastroProjetoEtapa.remover',
    },
    permissõesAdministracao: {
      editar: 'CadastroProjetoEtapaPadrao.editar',
      inserir: 'CadastroProjetoEtapaPadrao.inserir',
      remover: 'CadastroProjetoEtapaPadrao.remover',
    },
    requerPermissão: true,
    contextoEtapa: 'configuracoes',
  },
  mdo: {
    rotaPrefix: 'mdo.etapas',
    rotasAdministracao: {
      listar: 'mdo.etapasListar',
      criar: 'mdo.etapaCriar',
      editar: 'mdo.etapaEditar',
    },
    permissões: {
      editar: 'CadastroProjetoEtapaMDO.editar',
      inserir: 'CadastroProjetoEtapaMDO.inserir',
      remover: 'CadastroProjetoEtapaMDO.remover',
    },
    permissõesAdministracao: {
      editar: 'CadastroProjetoEtapaPadraoMDO.editar',
      inserir: 'CadastroProjetoEtapaPadraoMDO.inserir',
      remover: 'CadastroProjetoEtapaPadraoMDO.remover',
    },
    requerPermissão: true,
    contextoEtapa: 'configuracoes',
  },
  obras: {
    rotaPrefix: 'mdo.etapas',
    rotasAdministracao: {
      listar: 'mdo.etapasListar',
      criar: 'mdo.etapaCriar',
      editar: 'mdo.etapaEditar',
    },
    permissões: {
      editar: 'CadastroProjetoEtapaMDO.editar',
      inserir: 'CadastroProjetoEtapaMDO.inserir',
      remover: 'CadastroProjetoEtapaMDO.remover',
    },
    permissõesAdministracao: {
      editar: 'CadastroProjetoEtapaPadraoMDO.editar',
      inserir: 'CadastroProjetoEtapaPadraoMDO.inserir',
      remover: 'CadastroProjetoEtapaPadraoMDO.remover',
    },
    requerPermissão: true,
    contextoEtapa: 'configuracoes',
  },
  TransferenciasVoluntarias: {
    rotaPrefix: 'TransferenciasVoluntarias.etapa',
    permissões: {
      editar: null,
      inserir: null,
      remover: null,
    },
    requerPermissão: false,
    contextoEtapa: null, // Sem distinção padrão/específica
  },
};

export default configEtapas;
