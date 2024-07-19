export type ListaDePrivilegios =
    | 'SMAE.superadmin'
    | 'SMAE.login_suspenso'
    | 'CadastroFonteRecurso.inserir'
    | 'CadastroFonteRecurso.editar'
    | 'CadastroFonteRecurso.remover'
    | 'CadastroOds.inserir'
    | 'CadastroOds.editar'
    | 'CadastroOds.remover'
    | 'CadastroOdsPS.inserir'
    | 'CadastroOdsPS.editar'
    | 'CadastroOdsPS.remover'
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
    | 'CadastroPessoa.administrador.MDO'
    | 'CadastroPessoa.editar_responsabilidade'
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
    | 'CadastroMacroTemaPS.inserir'
    | 'CadastroMacroTemaPS.editar'
    | 'CadastroMacroTemaPS.remover'
    | 'CadastroTema.inserir'
    | 'CadastroTema.editar'
    | 'CadastroTema.remover'
    | 'CadastroTemaPS.inserir'
    | 'CadastroTemaPS.editar'
    | 'CadastroTemaPS.remover'
    | 'CadastroSubTema.inserir'
    | 'CadastroSubTema.editar'
    | 'CadastroSubTema.remover'
    | 'CadastroSubTemaPS.inserir'
    | 'CadastroSubTemaPS.editar'
    | 'CadastroSubTemaPS.remover'
    | 'CadastroTag.inserir'
    | 'CadastroTag.editar'
    | 'CadastroTag.remover'
    | 'CadastroTagPS.inserir'
    | 'CadastroTagPS.editar'
    | 'CadastroTagPS.remover'
    | 'CadastroTagPS.inserir'
    | 'CadastroTagPS.editar'
    | 'CadastroTagPS.remover'
    | 'CadastroProjetoEtapa.inserir'
    | 'CadastroProjetoEtapa.editar'
    | 'CadastroProjetoEtapa.remover'
    | 'CadastroMeta.listar'
    | 'CadastroMeta.administrador_no_pdm'
    | 'CadastroMetaPS.listar'
    | 'CadastroMetaPS.administrador_no_pdm'
    | 'CadastroMeta.orcamento'
    | 'CadastroMeta.administrador_orcamento'
    | 'CadastroMetaPS.orcamento'
    | 'CadastroMetaPS.administrador_orcamento'
    | 'CadastroVariavelCategorica.administrador'
    | 'CadastroVariavelCategoricaPS.administrador'
    | 'CadastroVariavelGlobal.administrador_no_orgao'
    | 'CadastroPainel.inserir'
    | 'CadastroPainel.editar'
    | 'CadastroPainel.remover'
    | 'CadastroPainel.visualizar'
    | 'CadastroPainelPS.inserir'
    | 'CadastroPainelPS.editar'
    | 'CadastroPainelPS.remover'
    | 'CadastroPainelPS.visualizar'
    | 'CadastroGrupoPaineis.inserir'
    | 'CadastroGrupoPaineis.editar'
    | 'CadastroGrupoPaineis.remover'
    | 'CadastroGrupoPaineisPS.inserir'
    | 'CadastroGrupoPaineisPS.editar'
    | 'CadastroGrupoPaineisPS.remover'
    | 'CadastroBancada.inserir'
    | 'CadastroBancada.editar'
    | 'CadastroBancada.remover'
    | 'CadastroPartido.inserir'
    | 'CadastroPartido.editar'
    | 'CadastroPartido.remover'
    | 'CadastroParlamentar.inserir'
    | 'CadastroParlamentar.editar'
    | 'CadastroParlamentar.remover'
    | 'CadastroTransferencia.inserir'
    | 'CadastroTransferencia.administrador'
    | 'CadastroTransferencia.listar'
    | 'CadastroTransferencia.editar'
    | 'CadastroTransferencia.remover'
    | 'CadastroWorkflows.inserir'
    | 'CadastroWorkflows.listar'
    | 'CadastroWorkflows.editar'
    | 'CadastroWorkflows.remover'
    | 'AndamentoWorkflow.listar'
    | 'CadastroCronogramaTransferencia.inserir'
    | 'CadastroCronogramaTransferencia.listar'
    | 'CadastroCronogramaTransferencia.remover'
    | 'Reports.executar.PDM'
    | 'Reports.remover.PDM'
    | 'Reports.executar.PlanoSetorial'
    | 'Reports.remover.PlanoSetorial'
    | 'Reports.executar.Projetos'
    | 'Reports.remover.Projetos'
    | 'Reports.executar.CasaCivil'
    | 'Reports.remover.CasaCivil'
    | 'Reports.executar.MDO'
    | 'Reports.remover.MDO'
    | 'CadastroProjetoEtapaMDO.inserir'
    | 'CadastroProjetoEtapaMDO.editar'
    | 'CadastroProjetoEtapaMDO.remover'
    | 'Config.editar'
    | 'Projeto.administrar_portfolios'
    | 'Projeto.administrar_portfolios_no_orgao'
    | 'ProjetoMDO.administrar_portfolios'
    | 'ProjetoMDO.administrar_portfolios_no_orgao'
    | 'Projeto.administrador_no_orgao'
    | 'ProjetoMDO.administrador_no_orgao'
    | 'Projeto.orcamento'
    | 'SMAE.gestor_de_projeto'
    | 'SMAE.colaborador_de_projeto'
    | 'PDM.coordenador_responsavel_cp'
    | 'PDM.tecnico_cp'
    | 'PDM.admin_cp'
    | 'PDM.ponto_focal'
    | 'Projeto.administrador'
    | 'ProjetoMDO.administrador'
    | 'Reports.dashboard_pdm'
    | 'Reports.dashboard_ps'
    | 'Reports.dashboard_portfolios'
    | 'Reports.dashboard_mdo'
    | 'CadastroGrupoPortfolio.administrador_no_orgao'
    | 'CadastroGrupoPortfolio.administrador'
    | 'CadastroGrupoPortfolioMDO.administrador'
    | 'CadastroGrupoPortfolioMDO.administrador_no_orgao'
    | 'SMAE.loga_direto_na_analise'
    | 'SMAE.espectador_de_projeto'
    | 'SMAE.espectador_de_painel_externo'
    | 'CadastroGrupoPainelExterno.administrador'
    | 'CadastroGrupoPainelExterno.administrador_no_orgao'
    | 'CadastroPainelExterno.inserir'
    | 'CadastroPainelExterno.editar'
    | 'CadastroPainelExterno.remover'
    | 'ProjetoTag.inserir'
    | 'ProjetoTag.editar'
    | 'ProjetoTag.remover'
    | 'ProjetoTagMDO.inserir'
    | 'ProjetoTagMDO.editar'
    | 'ProjetoTagMDO.remover'
    | 'PerfilAcesso.administrador'
    | 'SMAE.acesso_bi'
    | 'SMAE.acesso_telefone'
    | 'PS.tecnico_cp'
    | 'PS.admin_cp'
    | 'PS.ponto_focal'
    | 'CadastroPS.administrador'
    | 'CadastroPS.administrador_no_orgao'
    | 'ProjetoMDO.orcamento'
    | 'MDO.gestor_de_projeto'
    | 'MDO.colaborador_de_projeto'
    | 'MDO.espectador_de_projeto'
    | 'ModalidadeContratacao.inserir'
    | 'ModalidadeContratacao.editar'
    | 'ModalidadeContratacao.remover'
    | 'ProjetoProgramaMDO.inserir'
    | 'ProjetoProgramaMDO.editar'
    | 'ProjetoProgramaMDO.remover'
    | 'TipoAditivo.inserir'
    | 'TipoAditivo.editar'
    | 'TipoAditivo.remover'
    | 'AssuntoVariavel.inserir'
    | 'AssuntoVariavel.editar'
    | 'AssuntoVariavel.remover'
    | 'FonteVariavel.inserir'
    | 'FonteVariavel.editar'
    | 'FonteVariavel.remover'
    | 'CadastroGrupoVariavel.administrador'
    | 'CadastroGrupoVariavel.colaborador_responsavel'
    | 'SMAE.GrupoVariavel.participante'
    | 'SMAE.GrupoVariavel.colaborador'
    | 'CadastroVariavelGlobal.administrador';
