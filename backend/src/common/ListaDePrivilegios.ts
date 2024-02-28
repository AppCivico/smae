export type ListaDePrivilegios =
    | 'SMAE.superadmin'
    | 'CadastroFonteRecurso.inserir'
    | 'CadastroFonteRecurso.editar'
    | 'CadastroFonteRecurso.remover'
    | 'CadastroOds.inserir'
    | 'CadastroOds.editar'
    | 'CadastroOds.remover'
    | 'CadastroOrgao.inserir'
    | 'CadastroOrgao.editar'
    | 'CadastroOrgao.remover'
    | 'CadastroTipoOrgao.inserir'
    | 'CadastroTipoOrgao.editar'
    | 'CadastroTipoOrgao.remover'
    | 'CadastroTipoDocumento.inserir'
    | 'CadastroTipoDocumento.editar'
    | 'CadastroTipoDocumento.remover'
    | 'CadastroPessoa.inserir'
    | 'CadastroPessoa.editar'
    | 'CadastroPessoa.inativar'
    | 'CadastroPessoa.ativar'
    | 'CadastroPessoa.administrador'
    | 'CadastroUnidadeMedida.inserir'
    | 'CadastroUnidadeMedida.editar'
    | 'CadastroUnidadeMedida.remover'
    | 'CadastroRegiao.inserir'
    | 'CadastroRegiao.editar'
    | 'CadastroRegiao.remover'
    | 'CadastroPdm.inserir'
    | 'CadastroPdm.editar'
    | 'CadastroPdm.inativar'
    | 'CadastroPdm.ativar'
    | 'CadastroMacroTema.inserir'
    | 'CadastroMacroTema.editar'
    | 'CadastroMacroTema.remover'
    | 'CadastroTema.inserir'
    | 'CadastroTema.editar'
    | 'CadastroTema.remover'
    | 'CadastroSubTema.inserir'
    | 'CadastroSubTema.editar'
    | 'CadastroSubTema.remover'
    | 'CadastroTag.inserir'
    | 'CadastroTag.editar'
    | 'CadastroTag.remover'
    | 'CadastroMeta.listar'
    | 'CadastroMeta.inserir'
    | 'CadastroMeta.editar'
    | 'CadastroMeta.remover'
    | 'CadastroMeta.orcamento'
    | 'CadastroMeta.administrador_orcamento'
    | 'CadastroIndicador.inserir'
    | 'CadastroIndicador.editar'
    | 'CadastroIndicador.remover'
    | 'CadastroIniciativa.inserir'
    | 'CadastroIniciativa.editar'
    | 'CadastroIniciativa.remover'
    | 'CadastroAtividade.inserir'
    | 'CadastroAtividade.editar'
    | 'CadastroAtividade.remover'
    | 'CadastroCronograma.inserir'
    | 'CadastroCronograma.editar'
    | 'CadastroCronograma.remover'
    | 'CadastroPainel.inserir'
    | 'CadastroPainel.editar'
    | 'CadastroPainel.remover'
    | 'CadastroPainel.visualizar'
    | 'CadastroGrupoPaineis.inserir'
    | 'CadastroGrupoPaineis.editar'
    | 'CadastroGrupoPaineis.remover'
    | 'Reports.executar'
    | 'Reports.remover'
    | 'Config.editar'
    | 'Projeto.administrar_portfolios'
    | 'Projeto.administrar_portfolios_no_orgao'
    | 'Projeto.administrador_no_orgao'
    | 'Projeto.orcamento'
    | 'SMAE.gestor_de_projeto'
    | 'SMAE.colaborador_de_projeto'
    | 'PDM.coordenador_responsavel_cp'
    | 'PDM.tecnico_cp'
    | 'PDM.admin_cp'
    | 'PDM.ponto_focal'
    | 'Projeto.administrador'
    | 'Reports.dashboard_pdm'
    | 'Reports.dashboard_portfolios'
    | 'CadastroGrupoPortfolio.administrador_no_orgao'
    | 'CadastroGrupoPortfolio.administrador'
    | 'SMAE.loga_direto_na_analise'
    | 'SMAE.espectador_de_projeto'
    | 'SMAE.espectador_de_painel_externo'
    | 'CadastroGrupoPainelExterno.administrador'
    | 'CadastroGrupoPainelExterno.administrador_no_orgao'
    | 'CadastroPainelExterno.inserir'
    | 'CadastroPainelExterno.editar'
    | 'CadastroPainelExterno.remover'
    | 'PerfilAcesso.administrador'
    | 'SMAE.acesso_bi';
