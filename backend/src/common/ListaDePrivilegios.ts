export type ListaDePrivilegios =
    | 'SMAE.superadmin'
    | 'SMAE.login_suspenso'
    | 'SMAE.sysadmin'
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
    | 'CadastroTema.inserir'
    | 'CadastroTema.editar'
    | 'CadastroTema.remover'
    | 'CadastroSubTema.inserir'
    | 'CadastroSubTema.editar'
    | 'CadastroSubTema.remover'
    | 'CadastroTag.inserir'
    | 'CadastroTag.editar'
    | 'CadastroTag.remover'
    | 'CadastroProjetoEtapa.inserir'
    | 'CadastroProjetoEtapa.editar'
    | 'CadastroProjetoEtapa.remover'
    | 'CadastroMeta.listar'
    | 'CadastroMeta.administrador_no_pdm'
    | 'CadastroMeta.administrador_no_pdm_admin_cp'
    | 'CadastroMeta.orcamento'
    | 'CadastroVariavelCategorica.administrador'
    | 'CadastroVariavelGlobal.administrador_no_orgao'
    | 'CadastroMeta.administrador_orcamento'
    | 'CadastroMacroTemaPS.inserir'
    | 'CadastroMacroTemaPS.editar'
    | 'CadastroMacroTemaPS.remover'
    | 'CadastroTemaPS.inserir'
    | 'CadastroTemaPS.editar'
    | 'CadastroTemaPS.remover'
    | 'CadastroSubTemaPS.inserir'
    | 'CadastroSubTemaPS.editar'
    | 'CadastroSubTemaPS.remover'
    | 'CadastroTagPS.inserir'
    | 'CadastroTagPS.editar'
    | 'CadastroTagPS.remover'
    | 'CadastroTagPS.inserir'
    | 'CadastroTagPS.editar'
    | 'CadastroTagPS.remover'
    | 'CadastroMetaPS.listar'
    | 'CadastroMetaPS.administrador_no_pdm'
    | 'CadastroVariavelCategoricaPS.administrador'
    | 'CadastroPainelPS.inserir'
    | 'CadastroPainelPS.editar'
    | 'CadastroPainelPS.remover'
    | 'CadastroPainelPS.visualizar'
    | 'CadastroMacroTemaPDM.inserir'
    | 'CadastroMacroTemaPDM.editar'
    | 'CadastroMacroTemaPDM.remover'
    | 'CadastroTemaPDM.inserir'
    | 'CadastroTemaPDM.editar'
    | 'CadastroTemaPDM.remover'
    | 'CadastroSubTemaPDM.inserir'
    | 'CadastroSubTemaPDM.editar'
    | 'CadastroSubTemaPDM.remover'
    | 'CadastroTagPDM.inserir'
    | 'CadastroTagPDM.editar'
    | 'CadastroTagPDM.remover'
    | 'CadastroTagPDM.inserir'
    | 'CadastroTagPDM.editar'
    | 'CadastroTagPDM.remover'
    | 'CadastroMetaPDM.listar'
    | 'CadastroMetaPDM.administrador_no_pdm'
    | 'CadastroMetaPDM.orcamento'
    | 'CadastroMetaPDM.administrador_orcamento'
    | 'CadastroVariavelCategoricaPDM.administrador'
    | 'CadastroPainelPDM.inserir'
    | 'CadastroPainelPDM.editar'
    | 'CadastroPainelPDM.remover'
    | 'CadastroPainelPDM.visualizar'
    | 'CadastroPainel.inserir'
    | 'CadastroPainel.editar'
    | 'CadastroPainel.remover'
    | 'CadastroPainel.visualizar'
    | 'CadastroGrupoPaineis.inserir'
    | 'CadastroGrupoPaineis.editar'
    | 'CadastroGrupoPaineis.remover'
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
    | 'CadastroTransferencia.dashboard'
    | 'CadastroWorkflows.inserir'
    | 'CadastroWorkflows.listar'
    | 'CadastroWorkflows.editar'
    | 'CadastroWorkflows.remover'
    | 'AndamentoWorkflow.listar'
    | 'SMAE.gestor_distribuicao_recurso'
    | 'CadastroCronogramaTransferencia.inserir'
    | 'CadastroCronogramaTransferencia.listar'
    | 'CadastroCronogramaTransferencia.remover'
    | 'CadastroTransferenciaTipo.inserir'
    | 'CadastroTransferenciaTipo.editar'
    | 'CadastroTransferenciaTipo.remover'
    | 'Reports.executar.PDM'
    | 'Reports.remover.PDM'
    | 'Reports.executar.PlanoSetorial'
    | 'Reports.remover.PlanoSetorial'
    | 'Reports.executar.Projetos'
    | 'Reports.remover.Projetos'
    | 'Reports.executar.CasaCivil'
    | 'Reports.remover.CasaCivil'
    | 'Reports.executar.ProgramaDeMetas'
    | 'Reports.remover.ProgramaDeMetas'
    | 'CadastroEquipamentoMDO.inserir'
    | 'CadastroEquipamentoMDO.editar'
    | 'CadastroEquipamentoMDO.remover'
    | 'CadastroEmpreendimentoMDO.inserir'
    | 'CadastroEmpreendimentoMDO.editar'
    | 'CadastroEmpreendimentoMDO.remover'
    | 'TipoIntervecaoMDO.inserir'
    | 'TipoIntervecaoMDO.editar'
    | 'TipoIntervecaoMDO.remover'
    | 'GrupoTematicoMDO.inserir'
    | 'GrupoTematicoMDO.editar'
    | 'GrupoTematicoMDO.remover'
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
    | 'SMAE.gerente_de_projeto'
    | 'PDM.coordenador_responsavel_cp'
    | 'PDM.tecnico_cp'
    | 'PDM.admin_cp'
    | 'PDM.ponto_focal'
    | 'Projeto.administrador'
    | 'ProjetoMDO.administrador'
    | 'Reports.dashboard_pdm'
    | 'Reports.dashboard_programademetas'
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
    | 'SMAE.acesso_telefone'
    | 'CadastroPS.administrador'
    | 'CadastroPS.administrador_no_orgao'
    | 'CadastroPDM.administrador'
    | 'CadastroPDM.administrador_no_orgao'
    | 'ProjetoMDO.orcamento'
    | 'MDO.gestor_de_projeto'
    | 'MDO.colaborador_de_projeto'
    | 'MDO.espectador_de_projeto'
    | 'MDO.revisar_obra'
    | 'Projeto.revisar_projeto'
    | 'ModalidadeContratacao.inserir'
    | 'ModalidadeContratacao.editar'
    | 'ModalidadeContratacao.remover'
    | 'ProjetoProgramaMDO.inserir'
    | 'ProjetoProgramaMDO.editar'
    | 'ProjetoProgramaMDO.remover'
    | 'TipoAditivo.inserir'
    | 'TipoAditivo.editar'
    | 'TipoAditivo.remover'
    | 'TransfereGov.listar'
    | 'TransfereGov.atualizar'
    | 'TransfereGov.sincronizar'
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
    | 'CadastroVariavelGlobal.administrador'
    | 'CadastroClassificacao.inserir'
    | 'CadastroClassificacao.editar'
    | 'CadastroClassificacao.remover'
    | 'CadastroClassificacao.listar'
    | 'SMAE.liberar_pdm_as_ps'
    | 'SMAE.AtualizacaoEmLote'
    | 'Menu.AtualizacaoEmLote.MDO'
    | 'Menu.metas'
    | 'Menu.meta.pdm'
    | 'ReferencialEm.Equipe.ProgramaDeMetas'
    | 'ReferencialEm.Equipe.PS'
    | 'ReferencialEm.EquipeBanco.ProgramaDeMetas'
    | 'ReferencialEm.EquipeBanco.PS';
