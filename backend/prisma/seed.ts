import {
    DistribuicaoStatusTipo,
    EleicaoTipo,
    ModuloSistema,
    PerfilAcesso,
    Prisma,
    PrismaClient,
    Privilegio,
} from '@prisma/client';
import { ListaDePrivilegios } from '../src/common/ListaDePrivilegios';
import {
    CONST_COD_NOTA_DIST_RECURSO,
    CONST_CRONO_VAR_CATEGORICA_ID,
    CONST_TIPO_NOTA_DIST_RECURSO,
} from '../src/common/consts';
import { JOB_LOCK_NUMBER } from '../src/common/dto/locks';
const prisma = new PrismaClient({ log: ['query'] });

const ModuloDescricao: Record<string, [string, ModuloSistema | ModuloSistema[] | null]> = {
    CadastroOrgao: ['Órgãos', 'SMAE'],
    CadastroTipoOrgao: ['Tipos de Órgãos', 'SMAE'],
    CadastroPessoa: ['Pessoas', 'SMAE'],
    CadastroFonteRecurso: ['Fontes de Recurso', 'SMAE'],
    CadastroTipoDocumento: ['Tipos de Arquivo', 'SMAE'],
    CadastroRegiao: ['Regiões', 'SMAE'],
    SMAE: ['Regras de Negócio do SMAE', 'SMAE'],
    Config: ['Configurações', 'SMAE'],
    Reports: ['Relatórios', 'SMAE'],
    PerfilAcesso: ['Gerenciar Perfil de Acesso', 'SMAE'],
    CadastroPainelExterno: ['Painéis Externos', 'SMAE'],
    CadastroGrupoPainelExterno: ['Grupos de Painéis Externos', 'SMAE'],

    // migração de PDM
    CadastroUnidadeMedida: ['Unidades de Medida', 'SMAE'],

    CadastroPdm: ['Programa de Metas', 'PDM'],
    CadastroOds: ['Categorias', 'PDM'],
    CadastroTag: ['Tags', 'PDM'],
    CadastroMacroTema: ['Macro Temas', 'PDM'],
    CadastroSubTema: ['Sub Temas', 'PDM'],
    CadastroTema: ['Temas', 'PDM'],
    CadastroMeta: ['Metas', 'PDM'],
    CadastroIndicador: ['Indicadores', 'PDM'],
    CadastroVariavelCategorica: ['Variável Categórica', 'SMAE'],
    CadastroIniciativa: ['Iniciativas', 'PDM'],
    CadastroAtividade: ['Atividades', 'PDM'],
    CadastroCronograma: ['Cronogramas', 'PDM'],
    CadastroPainel: ['Painéis', 'PDM'],
    CadastroGrupoPaineis: ['Grupos de Painéis', 'PDM'],
    PDM: ['Regras de Negócio do Programas de Metas', 'PDM'],
    MDO: ['Regras de Negócio do Monitoramento de obras', 'MDO'],
    ReportsPdm: ['Relatórios de PDM', 'PDM'],

    CadastroPS: ['Plano Setorial', 'PlanoSetorial'],
    CadastroOdsPS: ['Categorias', 'PlanoSetorial'],
    CadastroTagPS: ['Tags', 'PlanoSetorial'],
    CadastroMacroTemaPS: ['Macro Temas', 'PlanoSetorial'],
    CadastroSubTemaPS: ['Sub Temas', 'PlanoSetorial'],
    CadastroTemaPS: ['Temas', 'PlanoSetorial'],
    CadastroMetaPS: ['Metas', 'PlanoSetorial'],
    CadastroIndicadorPS: ['Indicadores', 'PlanoSetorial'],
    CadastroVariavelCategoricaPS: ['', null],

    CadastroIniciativaPS: ['Iniciativas', 'PlanoSetorial'],
    CadastroAtividadePS: ['Atividades', 'PlanoSetorial'],
    CadastroCronogramaPS: ['Cronogramas', 'PlanoSetorial'],
    CadastroPainelPS: ['Painéis', 'PlanoSetorial'],
    CadastroGrupoPaineisPS: ['Grupos de Painéis', 'PlanoSetorial'],
    PS: ['Regras de Negócio do Plano Setorial', 'PlanoSetorial'],
    ReportsPS: ['Relatórios de Plano Setorial', 'PlanoSetorial'],

    FonteVariavel: ['Fontes de Variáveis', 'PlanoSetorial'],
    AssuntoVariavel: ['Assuntos de Variáveis', 'PlanoSetorial'],

    CadastroGrupoPortfolio: ['Grupos de Portfólio', 'Projetos'],
    CadastroGrupoPortfolioMDO: ['Grupos de Portfólio de MdO', 'MDO'],
    Projeto: ['Projetos', 'Projetos'],
    ProjetoMDO: ['Projetos de Obras', 'MDO'],
    CadastroProjetoEtapa: ['Etapas', 'Projetos'],
    CadastroProjetoEtapaMDO: ['Etapas', 'MDO'],
    ReportsProjetos: ['Relatórios de Projetos', 'Projetos'],
    ReportsMDO: ['Relatórios de MDO', 'MDO'],

    CadastroPartido: ['Partidos', 'CasaCivil'],
    CadastroBancada: ['Bancadas', 'CasaCivil'],
    CadastroParlamentar: ['Parlamentares', 'CasaCivil'],
    CadastroTransferencia: ['Transferências', 'CasaCivil'],
    CadastroWorkflow: ['Workflows', 'CasaCivil'],
    ReportsCasaCivil: ['Relatórios de Transferências Voluntárias', 'CasaCivil'],

    ProjetoTagMDO: ['Tags', 'MDO'],
    ProjetoTag: ['Tags', 'Projetos'],

    ModalidadeContratacao: ['Modalidade de Contratação', ['MDO', 'Projetos']],

    ProjetoProgramaMDO: ['Programas', 'MDO'],

    TipoAditivo: ['Tipo Aditivo', ['MDO', 'Projetos']],
    CadastroVariavelGlobal: ['Variáveis Globais', 'PlanoSetorial'], // depois vai ter o PDM
    CadastroGrupoVariavel: ['Grupos de Variáveis', ['PlanoSetorial']], // depois vai ter o PDM

    ModalidadeContratacaoMDO: ['', null],
    TipoAditivoMDO: ['', null],
    CadastroCargo: ['', null],
    CadastroCoordenadoria: ['', null],
    CadastroDepartamento: ['', null],
    CadastroDivisaoTecnica: ['', null],
    CadastroCicloFisico: ['', null],
    CadastroEixo: ['', null],
    CadastroObjetivoEstrategico: ['', null],
    CadastroEtapa: ['', null],
    CadastroGrupoPaineisExternas: ['', null],
} as const;

const PrivConfig: Record<string, false | [ListaDePrivilegios, string | false][]> = {
    CadastroCargo: false,
    CadastroCoordenadoria: false,
    CadastroDepartamento: false,
    CadastroDivisaoTecnica: false,
    CadastroCicloFisico: false,
    CadastroEixo: false,
    CadastroObjetivoEstrategico: false,
    CadastroEtapa: false,
    CadastroGrupoPaineisExternas: false,
    TipoAditivoMDO: false,
    ModalidadeContratacaoMDO: false,
    CadastroIndicador: false,
    CadastroIniciativa: false,
    CadastroIniciativaPS: false,
    CadastroAtividade: false,
    CadastroAtividadePS: false,
    CadastroIndicadorPS: false,
    CadastroCronograma: false,
    CadastroCronogramaPS: false,

    ModalidadeContratacao: [
        ['ModalidadeContratacao.inserir', 'Inserir Modalidade de Contratação'],
        ['ModalidadeContratacao.editar', 'Editar Modalidade de Contratação'],
        ['ModalidadeContratacao.remover', 'Remover Modalidade de Contratação'],
    ],
    ProjetoProgramaMDO: [
        ['ProjetoProgramaMDO.inserir', 'Inserir Programa'],
        ['ProjetoProgramaMDO.editar', 'Editar Programa'],
        ['ProjetoProgramaMDO.remover', 'Remover Programa'],
    ],
    TipoAditivo: [
        ['TipoAditivo.inserir', 'Inserir Tipo de Aditivo'],
        ['TipoAditivo.editar', 'Editar Tipo de Aditivo'],
        ['TipoAditivo.remover', 'Remover Tipo de Aditivo'],
    ],

    AssuntoVariavel: [
        ['AssuntoVariavel.inserir', 'Inserir Assunto de Variável'],
        ['AssuntoVariavel.editar', 'Editar Assunto de Variável'],
        ['AssuntoVariavel.remover', 'Remover Assunto de Variável'],
    ],
    FonteVariavel: [
        ['FonteVariavel.inserir', 'Inserir Fonte de Variável'],
        ['FonteVariavel.editar', 'Editar Fonte de Variável'],
        ['FonteVariavel.remover', 'Remover Fonte de Variável'],
    ],

    CadastroGrupoPortfolio: [
        ['CadastroGrupoPortfolio.administrador', 'Gerenciar Grupos de Portfólio de qualquer órgão'],
        ['CadastroGrupoPortfolio.administrador_no_orgao', 'Gerenciar Grupos de Portfólio do órgão ao qual pertence'],
    ],
    CadastroGrupoPortfolioMDO: [
        ['CadastroGrupoPortfolioMDO.administrador', 'Gerenciar Grupos de Portfólio de qualquer órgão de MdO'],
        [
            'CadastroGrupoPortfolioMDO.administrador_no_orgao',
            'Gerenciar Grupos de Portfólio do órgão ao qual pertence de MdO',
        ],
    ],
    CadastroPainelExterno: [
        ['CadastroPainelExterno.inserir', 'Cadastrar novos Painéis Externos'],
        ['CadastroPainelExterno.editar', 'Editar Painéis Externos'],
        ['CadastroPainelExterno.remover', 'Remover Painéis Externos'],
    ],
    CadastroGrupoPainelExterno: [
        ['CadastroGrupoPainelExterno.administrador', 'Gerenciar grupos de painéis externos de qualquer órgão'],
        [
            'CadastroGrupoPainelExterno.administrador_no_orgao',
            'Gerenciar grupos de painéis externos do órgão ao qual pertence',
        ],
    ],

    CadastroFonteRecurso: [
        ['CadastroFonteRecurso.inserir', 'Inserir Fonte de Recurso'],
        ['CadastroFonteRecurso.editar', 'Editar Fonte de Recurso'],
        ['CadastroFonteRecurso.remover', 'Remover Fonte de Recurso'],
    ],

    CadastroOds: [
        ['CadastroOds.inserir', 'Inserir Categoria'],
        ['CadastroOds.editar', 'Editar Categoria'],
        ['CadastroOds.remover', 'Remover Categoria'],
    ],

    CadastroOrgao: [
        ['CadastroOrgao.inserir', 'Inserir órgão'],
        ['CadastroOrgao.editar', 'Editar órgão'],
        ['CadastroOrgao.remover', 'Remover órgão'],
    ],
    CadastroTipoOrgao: [
        ['CadastroTipoOrgao.inserir', 'Inserir tipo órgão'],
        ['CadastroTipoOrgao.editar', 'Editar tipo órgão'],
        ['CadastroTipoOrgao.remover', 'Remover tipo órgão'],
    ],
    CadastroTipoDocumento: [
        ['CadastroTipoDocumento.inserir', 'Inserir tipo de documento'],
        ['CadastroTipoDocumento.editar', 'Editar tipo de documento'],
        ['CadastroTipoDocumento.remover', 'Remover tipo de documento'],
    ],
    CadastroPessoa: [
        ['CadastroPessoa.inserir', 'Inserir novos usuários no mesmo órgão'],
        ['CadastroPessoa.editar', 'Editar dados dos usuários no mesmo órgão'],
        ['CadastroPessoa.inativar', 'Inativar usuários no mesmo órgão'],
        ['CadastroPessoa.ativar', 'Ativar usuários no mesmo órgão'],
        ['CadastroPessoa.editar_responsabilidade', 'Substituir, adicionar ou remover responsabilidades dos usuários'],
        [
            'CadastroPessoa.administrador',
            'Editar/Inserir/Inativar/Ativar qualquer usuário, inclusive outros administradores',
        ],
    ],
    CadastroUnidadeMedida: [
        ['CadastroUnidadeMedida.inserir', 'Inserir Unidade de Medida'],
        ['CadastroUnidadeMedida.editar', 'Editar Unidade de Medida'],
        ['CadastroUnidadeMedida.remover', 'Remover Unidade de Medida'],
    ],

    CadastroRegiao: [
        ['CadastroRegiao.inserir', 'Inserir novas Regiões'],
        ['CadastroRegiao.editar', 'Editar Regiões existentes'],
        ['CadastroRegiao.remover', 'Remover Regiões'],
    ],

    CadastroProjetoEtapa: [
        ['CadastroProjetoEtapa.inserir', 'Inserir cadastro básico de Etapa'],
        ['CadastroProjetoEtapa.editar', 'Editar cadastro básico de Etapa'],
        ['CadastroProjetoEtapa.remover', 'Remover cadastro básico de Etapa'],
    ],
    CadastroProjetoEtapaMDO: [
        ['CadastroProjetoEtapaMDO.inserir', 'Inserir cadastro básico de Etapa de MdO'],
        ['CadastroProjetoEtapaMDO.editar', 'Editar cadastro básico de Etapa de MdO'],
        ['CadastroProjetoEtapaMDO.remover', 'Remover cadastro básico de Etapa de MdO'],
    ],
    // cadastros de PDM e metas
    CadastroPdm: [
        ['CadastroPdm.inserir', 'Inserir PDM'],
        ['CadastroPdm.editar', 'Editar PDM'],
        ['CadastroPdm.inativar', 'Inativar PDM'],
        ['CadastroPdm.ativar', 'Ativar PDM'],
    ],
    CadastroMacroTema: [
        ['CadastroMacroTema.inserir', 'Inserir Macro Tema'],
        ['CadastroMacroTema.editar', 'Editar Macro Tema'],
        ['CadastroMacroTema.remover', 'Remover Macro Tema'],
    ],
    CadastroMacroTemaPS: [
        ['CadastroMacroTemaPS.inserir', 'Inserir Macro Tema'],
        ['CadastroMacroTemaPS.editar', 'Editar Macro Tema'],
        ['CadastroMacroTemaPS.remover', 'Remover Macro Tema'],
    ],
    CadastroTema: [
        ['CadastroTema.inserir', 'Inserir Tema'],
        ['CadastroTema.editar', 'Editar Tema'],
        ['CadastroTema.remover', 'Remover Tema'],
    ],
    CadastroTemaPS: [
        ['CadastroTemaPS.inserir', 'Inserir Tema'],
        ['CadastroTemaPS.editar', 'Editar Tema'],
        ['CadastroTemaPS.remover', 'Remover Tema'],
    ],
    CadastroSubTema: [
        ['CadastroSubTema.inserir', 'Inserir SubTema'],
        ['CadastroSubTema.editar', 'Editar SubTema'],
        ['CadastroSubTema.remover', 'Remover SubTema'],
    ],
    CadastroSubTemaPS: [
        ['CadastroSubTemaPS.inserir', 'Inserir SubTema'],
        ['CadastroSubTemaPS.editar', 'Editar SubTema'],
        ['CadastroSubTemaPS.remover', 'Remover SubTema'],
    ],
    CadastroTag: [
        ['CadastroTag.inserir', 'Inserir Tag'],
        ['CadastroTag.editar', 'Editar Tag'],
        ['CadastroTag.remover', 'Remover Tag'],
    ],
    CadastroTagPS: [
        ['CadastroTagPS.inserir', 'Inserir Tag'],
        ['CadastroTagPS.editar', 'Editar Tag'],
        ['CadastroTagPS.remover', 'Remover Tag'],
    ],
    ProjetoTag: [
        ['ProjetoTag.inserir', 'Inserir Tag'],
        ['ProjetoTag.editar', 'Editar Tag'],
        ['ProjetoTag.remover', 'Remover Tag'],
    ],
    ProjetoTagMDO: [
        ['ProjetoTagMDO.inserir', 'Inserir Tag de MdO'],
        ['ProjetoTagMDO.editar', 'Editar Tag de MdO'],
        ['ProjetoTagMDO.remover', 'Remover Tag de MdO'],
    ],
    CadastroMeta: [
        // de fato, esse é o administrador, mas o frontend já usava o código CadastroMeta.inserir
        // quando tem essa permissão, é liberado vários outros itens
        [
            'CadastroMeta.administrador_no_pdm',
            'Administrar Metas, Iniciativas, Atividades, Indicadores, Cronogramas/Etapas e Painéis do PDM.',
        ],
        [
            'CadastroMeta.administrador_orcamento',
            'Atualizar a Execução Orçamentária de todas as metas e desmarcar orçamento realizado como concluído',
        ],
        ['CadastroMeta.orcamento', 'Atualizar a Execução Orçamentária pelas quais for responsável'],
        ['CadastroMeta.listar', 'Listar metas, iniciativas e atividades'],
    ],
    CadastroMetaPS: [
        [
            'CadastroMetaPS.administrador_no_pdm',
            'Administrar Metas, Iniciativas, Atividades, Indicadores, Cronogramas/Etapas e Painéis nos planos setoriais, de acordo com o seu perfil.',
        ],
        [
            'CadastroMetaPS.administrador_orcamento',
            'Atualizar a Execução Orçamentária de todas as metas e desmarcar orçamento realizado como concluído',
        ],
        ['CadastroMetaPS.orcamento', 'Atualizar a Execução Orçamentária pelas quais for responsável'],
        ['CadastroMetaPS.listar', 'Listar metas, iniciativas e atividades'],
    ],
    CadastroVariavelGlobal: [
        ['CadastroVariavelGlobal.administrador', 'Gerenciar variáveis globais para qualquer grupo de variável.'],
        ['CadastroVariavelGlobal.administrador_no_orgao', 'Inserir Indicadores e variáveis quando for responsável'],
    ],
    CadastroVariavelCategorica: [
        ['CadastroVariavelCategorica.administrador', 'Inserir, Editar e Remover e variáveis categóricas'],
    ],
    CadastroVariavelCategoricaPS: [['CadastroVariavelCategoricaPS.administrador', false]],

    CadastroPainel: [
        ['CadastroPainel.visualizar', 'Visualizar Painéis e detalhes do conteúdo'],
        ['CadastroPainel.inserir', 'Inserir Painéis pelos quais for responsável'],
        ['CadastroPainel.editar', 'Editar Painéis pelos quais for responsável'],
        ['CadastroPainel.remover', 'Remover Painéis pelos quais for responsável'],
    ],
    CadastroPainelPS: [
        ['CadastroPainelPS.visualizar', 'Visualizar Painéis e detalhes do conteúdo'],
        ['CadastroPainelPS.inserir', 'Inserir Painéis pelos quais for responsável'],
        ['CadastroPainelPS.editar', 'Editar Painéis pelos quais for responsável'],
        ['CadastroPainelPS.remover', 'Remover Painéis pelos quais for responsável'],
    ],
    CadastroGrupoPaineis: [
        ['CadastroGrupoPaineis.inserir', 'Inserir Grupo de Painéis'],
        ['CadastroGrupoPaineis.editar', 'Editar Grupo de Painéis'],
        ['CadastroGrupoPaineis.remover', 'Remover Grupo de Painéis'],
    ],

    CadastroGrupoPaineisPS: [
        ['CadastroGrupoPaineisPS.inserir', 'Inserir Grupo de Painéis'],
        ['CadastroGrupoPaineisPS.editar', 'Editar Grupo de Painéis'],
        ['CadastroGrupoPaineisPS.remover', 'Remover Grupo de Painéis'],
    ],

    CadastroBancada: [
        ['CadastroBancada.editar', 'Editar Bancadas'],
        ['CadastroBancada.inserir', 'Inserir Bancadas'],
        ['CadastroBancada.remover', 'Remover Bancadas'],
    ],
    CadastroPartido: [
        ['CadastroPartido.editar', 'Editar Partidos'],
        ['CadastroPartido.inserir', 'Inserir Partidos'],
        ['CadastroPartido.remover', 'Remover Partidos'],
    ],
    CadastroParlamentar: [
        ['CadastroParlamentar.editar', 'Editar Parlamentar'],
        ['CadastroParlamentar.inserir', 'Inserir Parlamentar'],
        ['CadastroParlamentar.remover', 'Remover Parlamentar'],
        ['SMAE.acesso_telefone', 'Ver todos os telefones do parlamentar'],
    ],
    CadastroTransferencia: [
        ['CadastroTransferencia.administrador', 'Inserir, Listar e remover transferência de qualquer órgão'],
        ['CadastroTransferencia.editar', 'Editar Transferência'],
        ['CadastroTransferencia.listar', 'Listar Transferência dos órgãos ao qual pertence'],
        ['CadastroTransferencia.inserir', 'Inserir Transferência'],
        ['CadastroTransferencia.remover', 'Remover Transferência'],
    ],
    CadastroWorkflow: [
        ['CadastroWorkflows.editar', 'Editar Workflows'],
        ['CadastroWorkflows.listar', 'Listar Workflows'],
        ['CadastroWorkflows.inserir', 'Inserir Workflows'],
        ['CadastroWorkflows.remover', 'Remover Workflows'],
        ['AndamentoWorkflow.listar', 'Listar Andamento de Workflows'],
        ['CadastroCronogramaTransferencia.inserir', 'Inserir tarefas do cronograma de Transferências.'],
        ['CadastroCronogramaTransferencia.listar', 'Listar tarefas do cronograma de Transferências.'],
        ['CadastroCronogramaTransferencia.remover', 'Remover tarefas do cronograma de Transferências.'],
    ],
    Reports: [
        ['Reports.dashboard_pdm', false], // lembrar que o delete sempre precisa vir antes do update/insert das novas
        ['Reports.dashboard_portfolios', false],
    ],
    ReportsPdm: [
        ['Reports.dashboard_pdm', 'Dashboard de programa de metas'],
        ['Reports.executar.PDM', 'Executar relatórios de programa de metas'],
        ['Reports.remover.PDM', 'Executar relatórios de programa de metas'],
    ],
    ReportsPS: [
        ['Reports.dashboard_ps', 'Dashboard de Plano Setorial'],
        ['Reports.executar.PlanoSetorial', 'Executar relatórios de Programa Setorial'],
        ['Reports.remover.PlanoSetorial', 'Executar relatórios de Programa Setorial'],
    ],
    ReportsProjetos: [
        ['Reports.dashboard_portfolios', 'Dashboard de portfólios'],
        ['Reports.executar.Projetos', 'Executar relatórios de projetos'],
        ['Reports.remover.Projetos', 'Executar relatórios de projetos'],
    ],
    ReportsMDO: [
        ['Reports.dashboard_mdo', 'Dashboard de portfólios de MdO'],
        ['Reports.executar.MDO', 'Executar relatórios de projetos de MdO'],
        ['Reports.remover.MDO', 'Executar relatórios de projetos de MdO'],
    ],
    ReportsCasaCivil: [
        ['Reports.executar.CasaCivil', 'Executar relatórios de transferências voluntárias'],
        ['Reports.remover.CasaCivil', 'Executar relatórios de transferências voluntárias'],
    ],
    PerfilAcesso: [['PerfilAcesso.administrador', false]],
    Config: [
        ['SMAE.login_suspenso', 'Impede o login do usuário, mas mantém os dados e possibilidade ser responsável'],
        ['Config.editar', 'Editar configuração de textos do sistema'],
        ['SMAE.superadmin', 'Faz parte do perfil de Administrador Geral'],
        ['SMAE.loga_direto_na_analise', 'Acesso direto à parte de análise ao fazer login'],
        ['SMAE.acesso_bi', 'Acesso total aos Business Intelligence (BI) de projetos/metas'],
        ['SMAE.espectador_de_painel_externo', 'Visualizador de painel externo'],
        ['PerfilAcesso.administrador', 'Gerenciar Perfil de Acesso'],
    ],
    CadastroGrupoVariavel: [
        ['CadastroGrupoVariavel.administrador', 'Gerenciar Grupos de Variáveis'],
        ['CadastroGrupoVariavel.colaborador_responsavel', 'Gerenciar Grupos de Variáveis onde é responsável'],
    ],
    Projeto: [
        ['Projeto.administrar_portfolios', 'Administrar todos os portfólios, sem acesso aos projetos'],
        [
            'Projeto.administrar_portfolios_no_orgao',
            'Criar e editar portfólios exclusivamente do órgão ao qual pertence',
        ],
        ['Projeto.administrador', 'Acesso total aos projetos'],
        ['Projeto.administrador_no_orgao', 'Acesso total aos projetos com o portfólio do órgão ao qual pertence'],
        ['Projeto.orcamento', 'Atualizar a Execução Orçamentária pelas quais for responsável'],
        ['SMAE.espectador_de_projeto', 'Participante de Grupos de Portfólio'],
        ['SMAE.gestor_de_projeto', 'Gestor de Projeto'],
        ['SMAE.colaborador_de_projeto', 'Colaborador de projeto'],
    ],
    ProjetoMDO: [
        ['ProjetoMDO.administrar_portfolios', 'Administrar todos os portfólios de MdO, sem acesso aos projetos'],
        [
            'ProjetoMDO.administrar_portfolios_no_orgao',
            'Criar e editar portfólios de MdO exclusivamente do órgão ao qual pertence',
        ],
        ['ProjetoMDO.administrador', 'Acesso total aos projetos de MdO.'],
        [
            'ProjetoMDO.administrador_no_orgao',
            'Acesso total aos projetos de MdO com o portfólio do órgão ao qual pertence',
        ],
        ['ProjetoMDO.orcamento', 'Atualizar a Execução Orçamentária de MdO pelas quais for responsável'],
        ['MDO.espectador_de_projeto', 'Participante de Grupos de Portfólio de MdO'],
        ['MDO.gestor_de_projeto', 'Gestor de Projeto de MdO'],
        ['MDO.colaborador_de_projeto', 'Colaborador de projeto de MdO'],
        [
            'CadastroPessoa.administrador.MDO',
            'Editar/Inserir/Inativar/Ativar qualquer usuário, inclusive outros administradores',
        ],
    ],
    PDM: [
        ['PDM.coordenador_responsavel_cp', 'Pode ser designado como Coordenador Responsável na CP'],
        ['PDM.tecnico_cp', 'Monitoramento - Técnico CP'],
        ['PDM.admin_cp', 'Monitoramento - Administrador CP'],
        ['PDM.ponto_focal', 'Monitoramento - Ponto Focal'],
    ],
    CadastroPS: [
        ['CadastroPS.administrador', 'Gerenciar Plano Setorial'],
        ['CadastroPS.administrador_no_orgao', 'Gerenciar Plano Setorial do órgão ao qual pertence'],
    ],
    PS: [
        ['PS.tecnico_cp', 'Plano Setorial - Técnico CP'],
        ['PS.admin_cp', 'Plano Setorial - Administrador CP'],
        ['PS.ponto_focal', 'Plano Setorial - Ponto Focal'],
        ['SMAE.GrupoVariavel.participante', 'Pode participar de grupos de variáveis'],
        ['SMAE.GrupoVariavel.colaborador', 'Pode ser colaborador de grupos de variáveis'],
    ],
};

const todosPrivilegios: ListaDePrivilegios[] = [];

for (const codModulo in PrivConfig) {
    const privilegio = PrivConfig[codModulo];
    if (privilegio === false) continue;

    for (const priv of privilegio) {
        if (typeof priv[1] == 'string') todosPrivilegios.push(priv[0]);
    }
}
console.log(todosPrivilegios);

const PrivRespNaCp: ListaDePrivilegios[] = [
    'PDM.coordenador_responsavel_cp',
    'PDM.tecnico_cp',
    'CadastroMeta.listar',
    'CadastroMeta.administrador_no_pdm',
    'CadastroPainel.inserir',
    'CadastroPainel.editar',
    'CadastroPainel.remover',
    'CadastroPainel.visualizar',
];

const PrivRespNaCpPS: ListaDePrivilegios[] = [
    'PS.tecnico_cp',
    'CadastroMetaPS.listar',
    'CadastroMetaPS.administrador_no_pdm',
    'CadastroVariavelGlobal.administrador_no_orgao',

    'CadastroPainelPS.inserir',
    'CadastroPainelPS.editar',
    'CadastroPainelPS.remover',
    'CadastroPainelPS.visualizar',
];

const PSCadastroBasico: ListaDePrivilegios[] = [
    'CadastroMacroTemaPS.inserir',
    'CadastroMacroTemaPS.editar',
    'CadastroMacroTemaPS.remover',
    'CadastroTemaPS.inserir',
    'CadastroTemaPS.editar',
    'CadastroTemaPS.remover',
    'CadastroSubTemaPS.inserir',
    'CadastroSubTemaPS.editar',
    'CadastroSubTemaPS.remover',
    'CadastroTagPS.inserir',
    'CadastroTagPS.editar',
    'CadastroTagPS.remover',
];
const PSMetasReportsEAdmin: ListaDePrivilegios[] = [
    'CadastroMetaPS.administrador_no_pdm',
    'CadastroMetaPS.administrador_orcamento',

    'CadastroPainelPS.inserir',
    'CadastroPainelPS.editar',
    'CadastroPainelPS.remover',
    'CadastroPainelPS.visualizar',

    'Reports.executar.PlanoSetorial',
    'Reports.remover.PlanoSetorial',
    'Reports.dashboard_ps',
];
const removerNomePerfil = (nome: string) => {
    return {
        nome: nome,
        descricao: '',
        privilegios: false as const,
    };
};

const atualizacoesPerfil: Array<PromiseLike<any>> = [];
const atualizarNomePerfil = (nomeCorrente: string, nomesAnterioes: string[]) => {
    for (const nomeAnterior of nomesAnterioes) {
        atualizacoesPerfil.push(
            prisma.perfilAcesso.updateMany({
                where: { nome: nomeAnterior },
                data: { nome: nomeCorrente },
            })
        );
    }
    return nomeCorrente;
};

const PerfilAcessoConfig: {
    nome: string;
    descricao: string;
    privilegios: ListaDePrivilegios[] | false;
}[] = [
    // toda vez que mudar o nome de algum item, é necessário adicionar o label antigo usando o
    // metodo atualizarNomePerfil e depois jogar no final aqui o removerNomePerfil
    {
        // o TipoAditivo vai ficar fora do "todos os privilégios"
        nome: atualizarNomePerfil('Administrador Geral do SMAE', ['Administrador Geral']),
        descricao: 'Administrador Geral - Todas as permissões do sistema, exceto regras de negócio específicas.',
        privilegios: ['SMAE.superadmin', ...todosPrivilegios.filter((e) => /^(PDM|SMAE|PS|MDO)\./.test(e) === false)],
    },
    {
        nome: 'Suspensão de Login',
        descricao: 'Impede o login do usuário, mas mantém os dados e possibilidade ser responsável',
        privilegios: ['SMAE.login_suspenso'],
    },
    {
        nome: atualizarNomePerfil('Administrador Coordenadoria de Planejamento', ['Administrador CP']),
        descricao:
            'No monitoramento, pode visualizar e editar dados de todas as metas, em todos os ciclos. Gerenciar parcialmente as metas e PDM.',
        privilegios: [
            'PDM.admin_cp',
            'CadastroVariavelCategorica.administrador',
            'CadastroMeta.administrador_orcamento',
            'CadastroPdm.editar',
            'CadastroMacroTema.inserir',
            'CadastroMacroTema.editar',
            'CadastroMacroTema.remover',
            'CadastroTema.inserir',
            'CadastroTema.editar',
            'CadastroTema.remover',
            'CadastroSubTema.inserir',
            'CadastroSubTema.editar',
            'CadastroSubTema.remover',
            'CadastroTag.inserir',
            'CadastroTag.editar',
            'CadastroTag.remover',
            'CadastroMeta.administrador_no_pdm', // pq ele é admin_cp, vai poder editar varias coisas
            'CadastroMeta.listar',
            'CadastroPainel.inserir',
            'CadastroPainel.editar',
            'CadastroPainel.remover',
            'CadastroPainel.visualizar',

            'Reports.executar.PDM',
            'Reports.remover.PDM',

            'Reports.dashboard_pdm',
        ],
    },

    {
        nome: atualizarNomePerfil('Administrador de Plano Setorial', []),
        descricao:
            'Pode editar qualquer plano setorial, administrar variaveis globais. Não pode participar como responsável.',
        privilegios: [
            'PS.admin_cp',
            'CadastroPS.administrador',
            'CadastroVariavelGlobal.administrador',
            ...PSCadastroBasico, // Tema, Tags, etc...
            ...PSMetasReportsEAdmin, // Metas, Reports, Painel
        ],
    },

    {
        nome: atualizarNomePerfil('Administrador de Plano Setorial no órgão', []),
        descricao:
            'Pode editar qualquer plano setorial do órgão ao qual pertence, assim como suas variáveis globais. Não pode participar como responsável.',
        privilegios: [
            'PS.admin_cp',
            'CadastroPS.administrador_no_orgao', // so pode criar no orgao_admin dele
            'CadastroVariavelGlobal.administrador_no_orgao',
            ...PSCadastroBasico, // Tema, Tags, etc...
            ...PSMetasReportsEAdmin, // Metas, Reports, Painel
        ],
    },

    {
        nome: atualizarNomePerfil('Administrador Coordenadoria de Planejamento Setorial', []),
        descricao: '',
        privilegios: false,
    },

    {
        nome: atualizarNomePerfil('Gestor de usuários no mesmo órgão', ['Coordenadoria de Planejamento']),
        descricao: 'Pode criar e editar usuários no mesmo órgão',
        privilegios: [
            'CadastroPessoa.inserir',
            'CadastroPessoa.editar',
            'CadastroPessoa.inativar',
            'CadastroPessoa.ativar',
        ],
    },
    {
        nome: 'Ponto Focal',
        descricao: 'Vê somente as metas onde há dados para registrar evolução no ciclo corrente',
        privilegios: ['PDM.ponto_focal', 'CadastroMeta.listar', 'CadastroPainel.visualizar'],
    },
    {
        nome: 'Ponto Focal Setorial',
        descricao: 'Vê somente as metas onde há dados para registrar evolução no ciclo corrente',
        privilegios: ['PS.ponto_focal', 'CadastroMetaPS.listar', 'CadastroPainelPS.visualizar'],
    },

    {
        nome: atualizarNomePerfil('Responsável por meta na Coordenadoria de Planejamento', [
            'Responsável por meta na CP',
        ]),
        descricao:
            'Usuários com esta opção podem ser selecionados como Responsável da Coordenadoria na criação/edição de Metas',
        privilegios: PrivRespNaCp,
    },
    {
        nome: atualizarNomePerfil('Responsável por meta na Coordenadoria de Planejamento Setorial', [
            'Responsável por meta na CP',
        ]),
        descricao:
            'Usuários com esta opção podem ser selecionados como Responsável da Coordenadoria na criação/edição de Metas',
        privilegios: PrivRespNaCpPS,
    },
    {
        nome: atualizarNomePerfil('Orçamento - Metas', ['Orçamento']),
        descricao: 'Pode criar orçamento para as metas que tem acesso.',
        privilegios: ['CadastroMeta.orcamento'],
    },
    {
        nome: atualizarNomePerfil('Orçamento - Metas Setorial', ['Orçamento']),
        descricao: 'Pode criar orçamento para as metas que tem acesso.',
        privilegios: ['CadastroMetaPS.orcamento'],
    },
    {
        nome: 'Orçamento - Projetos',
        descricao: 'Pode criar orçamento para os projetos que tem acesso.',
        privilegios: ['Projeto.orcamento'],
    },
    {
        nome: 'Orçamento - MdO',
        descricao: 'Pode criar orçamento para as obras que tem acesso.',
        privilegios: ['ProjetoMDO.orcamento'],
    },
    {
        nome: 'Administrador de Portfólio',
        descricao: 'Gerenciar os Portfólios',
        privilegios: ['Projeto.administrar_portfolios', 'CadastroGrupoPortfolio.administrador'],
    },
    {
        nome: 'Administrador de Portfólio do MdO',
        descricao: 'Gerenciar os Portfólios',
        privilegios: ['ProjetoMDO.administrar_portfolios', 'CadastroGrupoPortfolioMDO.administrador'],
    },
    {
        nome: 'Administrador de Grupo de Variáveis',
        descricao: 'Gerenciar todos os Grupos de Variáveis',
        privilegios: ['CadastroGrupoVariavel.administrador'],
    },
    {
        nome: 'Colaborador de Grupo de Variáveis',
        descricao: 'Gerenciar os Grupos de Variáveis onde é responsável',
        privilegios: ['CadastroGrupoVariavel.colaborador_responsavel', 'SMAE.GrupoVariavel.colaborador'],
    },

    {
        nome: 'Participante de Grupo de Variáveis',
        descricao:
            'Pode ser participante de grupos de variáveis, podendo ter qualquer perfil (Medição, Validação, Liberação)',
        privilegios: ['SMAE.GrupoVariavel.participante'],
    },

    {
        nome: 'Gestor de Projetos no Órgão',
        descricao: 'Gerenciar todos os projetos no órgão em qual faz parte',
        privilegios: [
            'Reports.executar.Projetos', // TODO remoer, afinal, precisa dos filtros no reports
            'Projeto.administrador_no_orgao',
            'Reports.dashboard_portfolios',
            'Projeto.administrar_portfolios_no_orgao',
            'CadastroGrupoPortfolio.administrador_no_orgao',
        ],
    },

    {
        nome: 'Gestor de Cadastros Básicos de Projetos e Obras',
        descricao:
            'Responsável por gerenciar os cadastros básicos de projetos e obras, incluindo a criação, edição e remoção de etapas, modalidades de contratação e tipos de aditivo. Este perfil garante a consistência e organização das informações essenciais para o gerenciamento de projetos e obras.',
        privilegios: [
            'CadastroProjetoEtapa.inserir',
            'CadastroProjetoEtapa.editar',
            'CadastroProjetoEtapa.remover',

            'ModalidadeContratacao.inserir',
            'ModalidadeContratacao.editar',
            'ModalidadeContratacao.remover',

            'TipoAditivo.inserir',
            'TipoAditivo.editar',
            'TipoAditivo.remover',
        ],
    },
    {
        nome: 'Administrador do Módulo de Obras',
        descricao: 'Gerenciar cadastros básicos e acesso irrestrito às obras',
        privilegios: ['ProjetoMDO.administrador', 'CadastroPessoa.administrador.MDO'],
    },
    {
        nome: 'Gestor de Obras no Órgão',
        descricao: 'Gerenciar todos as obras no órgão em qual faz parte',
        privilegios: [
            'ProjetoTagMDO.inserir',
            'ProjetoTagMDO.editar',
            'ProjetoTagMDO.remover',
            'Reports.executar.MDO', // TODO remoer, afinal, precisa dos filtros no reports
            'ProjetoMDO.administrador_no_orgao',
            'Reports.dashboard_mdo',
            'ProjetoMDO.administrar_portfolios_no_orgao',
            'CadastroGrupoPortfolioMDO.administrador_no_orgao',

            // not really, isso aqui ta mais pra ADMINISTRADOR, que ainda não colocamos esse perfil
            'CadastroProjetoEtapaMDO.inserir',
            'CadastroProjetoEtapaMDO.editar',
            'CadastroProjetoEtapaMDO.remover',

            'ProjetoProgramaMDO.inserir',
            'ProjetoProgramaMDO.editar',
            'ProjetoProgramaMDO.remover',
        ],
    },
    {
        nome: atualizarNomePerfil('Gestor de projetos', ['Órgão Gestor']),
        descricao: 'Pode ser escolhido como responsável no órgão gestor de projetos',
        privilegios: [
            'Reports.executar.Projetos', // TODO remoer, afinal, precisa dos filtros no reports
            'SMAE.gestor_de_projeto',
            'Reports.dashboard_portfolios',
        ],
    },
    {
        nome: atualizarNomePerfil('Gestor da Obra', []),
        descricao: 'Pode ser escolhido como responsável no órgão gestor de MdO',
        privilegios: [
            'ProjetoTagMDO.inserir',
            'ProjetoTagMDO.editar',
            'ProjetoTagMDO.remover',
            'Reports.executar.MDO', // TODO remoer, afinal, precisa dos filtros no reports
            'MDO.gestor_de_projeto',
            'Reports.dashboard_mdo',
            'CadastroProjetoEtapaMDO.inserir',
            'CadastroProjetoEtapaMDO.editar',
            'CadastroProjetoEtapaMDO.remover',
        ],
    },
    {
        nome: 'Colaborador de Projetos',
        descricao:
            'Pode ser escolhido como responsável no órgão responsável pelo projeto e contribuir durante a fase de registro e planejamento, e dados de execução do cronograma e acompanhamento do risco',
        privilegios: [
            'Reports.executar.Projetos', // TODO remoer, afinal, precisa dos filtros no reports
            'SMAE.colaborador_de_projeto',
            'Reports.dashboard_portfolios',
        ],
    },
    {
        nome: 'Colaborador de obra no órgão',
        descricao:
            'Pode ser escolhido como responsável no órgão responsável pela obra e contribuir durante a fase de registro e planejamento, e dados de execução do cronograma e acompanhamento do risco',
        privilegios: [
            'Reports.executar.MDO', // TODO remoer, afinal, precisa dos filtros no reports
            'MDO.colaborador_de_projeto',
            'Reports.dashboard_mdo',
            'CadastroProjetoEtapaMDO.inserir',
            'CadastroProjetoEtapaMDO.editar',
            'CadastroProjetoEtapaMDO.remover',
        ],
    },
    {
        nome: 'Analista de dados',
        descricao: 'Entra diretamente para as análises e tem acesso total para metas e projetos',
        privilegios: [
            'SMAE.loga_direto_na_analise',
            'SMAE.acesso_bi',
            'Reports.dashboard_pdm',
            'Reports.dashboard_portfolios',
        ],
    },
    {
        nome: atualizarNomePerfil('Observador de projetos', ['Espectador de projetos', 'Consulta multissetorial']),
        descricao: 'Pode participar como leitor em portfólio e projetos',
        privilegios: ['SMAE.espectador_de_projeto'],
    },
    // TODO Observador de obras
    {
        nome: atualizarNomePerfil('Observador de obra', []),
        descricao: 'Pode participar como leitor em portfólio e obras',
        privilegios: ['MDO.espectador_de_projeto'],
    },
    {
        nome: atualizarNomePerfil('Observador de painéis externos', []),
        descricao: 'Pode participar como leitor em painéis externos',
        privilegios: ['SMAE.espectador_de_painel_externo'],
    },
    {
        nome: atualizarNomePerfil('Administrador Casa Civil', []),
        descricao: 'Visualizar o telefone de parlamentares',
        privilegios: ['SMAE.acesso_telefone'],
    },
    {
        nome: 'Gestor Casa Civil',
        descricao: 'Pode gerir entidades em Casa Civil',
        privilegios: [
            'CadastroBancada.editar',
            'CadastroBancada.inserir',
            'CadastroBancada.remover',
            'CadastroPartido.editar',
            'CadastroPartido.inserir',
            'CadastroPartido.remover',
            'CadastroParlamentar.editar',
            'CadastroParlamentar.inserir',
            'CadastroParlamentar.remover',
            'Reports.remover.CasaCivil',
            'Reports.executar.CasaCivil',
            'CadastroTransferencia.editar',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.administrador',
            'CadastroTransferencia.remover',
            'CadastroWorkflows.editar',
            'CadastroWorkflows.listar',
            'CadastroWorkflows.inserir',
            'CadastroWorkflows.remover',
            'CadastroCronogramaTransferencia.inserir',
            'CadastroCronogramaTransferencia.listar',
            'CadastroCronogramaTransferencia.remover',
            'AndamentoWorkflow.listar',
        ],
    },
    {
        nome: 'Gestor de Distribuição de Recurso',
        descricao: 'Pode visualizar todas as distribuições de recurso para seu órgão.',
        privilegios: [
            'CadastroTransferencia.listar',
            'AndamentoWorkflow.listar',
            // TODO? Maybe precisa ter permissões para editar e remover, e ai precisaria melhorar
            // o "pode_editar" do crono
            'CadastroCronogramaTransferencia.inserir',
            'CadastroCronogramaTransferencia.listar',
        ],
    },
    removerNomePerfil('Técnico CP'),
    removerNomePerfil('Orçamento'),
    removerNomePerfil('Unidade de Entregas'),
    removerNomePerfil('Responsável por meta na CP - orçamento'),
    removerNomePerfil('Administrador de Portfolio'),
    removerNomePerfil('Administrador Geral'),
    removerNomePerfil('Administrador CP'),
    removerNomePerfil('Coordenadoria de Planejamento'),
    removerNomePerfil('Criador e Gestor de Projetos no Órgão'),
    removerNomePerfil('Responsável por meta na CP'),
];

async function main() {
    if (atualizacoesPerfil.length) await Promise.all(atualizacoesPerfil);

    await prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
        const locked: { locked: boolean }[] =
            await prismaTx.$queryRaw`SELECT pg_try_advisory_xact_lock(${JOB_LOCK_NUMBER}) as locked`;

        if (!locked[0].locked) return;

        await criar_emaildb_config();
        await criar_texto_config();
        await atualizar_modulos_e_privilegios();
        await atualizar_perfil_acesso();

        await atualizar_superadmin();
        await ensure_bot_user();
        await ensure_categorica_cronograma();

        await ensure_tiponota_dist_recurso();

        await populateEleicao();
        await populateDistribuicaoStatusBase();

        await prismaTx.$queryRaw`select f_update_modulos_sistemas();`;
    });
}

async function ensure_tiponota_dist_recurso() {
    await prisma.tipoNota.upsert({
        where: { id: CONST_TIPO_NOTA_DIST_RECURSO },
        create: {
            id: CONST_CRONO_VAR_CATEGORICA_ID,
            codigo: CONST_COD_NOTA_DIST_RECURSO,
            autogerenciavel: true,

            permite_email: true,
            visivel_resp_orgao: true,
            eh_publico: true,
            permite_enderecamento: true,
            permite_replica: false,
            permite_revisao: false,
        },
        update: {
            eh_publico: true,
            permite_enderecamento: true,
            codigo: CONST_COD_NOTA_DIST_RECURSO,
        },
    });
}

async function ensure_categorica_cronograma() {
    await prisma.variavelCategorica.upsert({
        where: { tipo: 'Cronograma', id: CONST_CRONO_VAR_CATEGORICA_ID },
        create: {
            id: CONST_CRONO_VAR_CATEGORICA_ID,
            tipo: 'Cronograma',
            titulo: 'Situação do Cronograma',
            descricao: 'Se a tarefa está concluída ou não concluido',
            valores: {
                createMany: {
                    data: [
                        {
                            titulo: 'Não feito',
                            valor_variavel: 0,
                            ordem: 1,
                        },
                        {
                            titulo: 'Feito',
                            valor_variavel: 1,
                            ordem: 2,
                        },
                    ],
                },
            },
        },
        update: {},
    });
}

async function atualizar_modulos_e_privilegios() {
    const modulosInDb = await prisma.privilegioModulo.findMany();
    const modulosByCodigo: Record<string, (typeof modulosInDb)[0]> = {};
    for (const r of modulosInDb) {
        modulosByCodigo[r.codigo] = r;
    }

    const privInDb = await prisma.privilegio.findMany();
    const privByCodigo: Record<string, (typeof privInDb)[0]> = {};
    for (const r of privInDb) {
        privByCodigo[r.codigo] = r;
    }

    for (const codModulo in PrivConfig) {
        const privilegio = PrivConfig[codModulo];

        if (privilegio === false) {
            await removeModulo(codModulo);
        } else {
            await upsertModulo(codModulo, privilegio);
        }
    }

    await prisma.perfilPrivilegio.deleteMany({
        where: {
            privilegio: {
                codigo: {
                    notIn: todosPrivilegios,
                },
            },
        },
    });

    await prisma.privilegio.deleteMany({
        where: {
            codigo: {
                notIn: todosPrivilegios,
            },
        },
    });

    async function upsertModulo(codModulo: string, privilegio: [ListaDePrivilegios, string | false][]) {
        const modConfig = ModuloDescricao[codModulo];

        if (!modConfig) throw new Error(`Modulo ${codModulo} não encontrado`);

        if (!modConfig[1]) return;

        let moduloObject = modulosByCodigo[codModulo];

        if (!moduloObject || moduloObject.descricao !== modConfig[0] || moduloObject.modulo_sistema !== modConfig[1]) {
            moduloObject = await prisma.privilegioModulo.upsert({
                where: { codigo: codModulo },
                update: {
                    descricao: modConfig[0],
                    modulo_sistema: Array.isArray(modConfig[1]) ? modConfig[1] : [modConfig[1]],
                },
                create: {
                    codigo: codModulo,
                    descricao: modConfig[0],
                    modulo_sistema: Array.isArray(modConfig[1]) ? modConfig[1] : [modConfig[1]],
                },
            });
        }
        for (const priv of privilegio) {
            await upsert_privilegios(moduloObject.id, priv[0], priv[1], privByCodigo);
        }
    }
}

async function removeModulo(codModulo: string) {
    await prisma.perfilPrivilegio.deleteMany({
        where: {
            privilegio: {
                modulo: {
                    codigo: codModulo,
                },
            },
        },
    });

    await prisma.privilegio.deleteMany({
        where: {
            modulo: {
                codigo: codModulo,
            },
        },
    });

    await prisma.privilegioModulo.deleteMany({
        where: {
            codigo: codModulo,
        },
    });
}
async function criar_texto_config() {
    await prisma.textoConfig.upsert({
        where: { id: 1 },
        update: {},
        create: {
            bemvindo_email: 'Ao acessar o SMAE, Você está ciente e autoriza...',
            tos: '...O acesso ao SMAE indica ciência e concordância com os termos acima',
        },
    });
}

async function criar_emaildb_config() {
    await prisma.emaildbConfig.upsert({
        where: { id: 1 },
        update: {},
        create: {
            from: '"Sistema" <sistema@exemplo.com>',
            template_resolver_class: 'Shypper::TemplateResolvers::HTTP',
            template_resolver_config: { 'base_url': 'http://smae_api:3001/public/email-templates/' },
            email_transporter_class: 'Email::Sender::Transport::SMTP::Persistent',
            email_transporter_config: {
                'sasl_password': '',
                'sasl_username': 'apikey',
                'port': '25',
                'host': 'smtp_web',
            },
        },
    });
}

async function upsert_privilegios(
    moduloId: number,
    codigo: string,
    nome: string | false,
    cache: Record<string, Privilegio>
) {
    const priv = cache[codigo];

    if (nome === false && !priv) return Promise.resolve(0);
    if (nome === false) {
        if (priv.modulo_id !== moduloId) return Promise.resolve(0);

        await prisma.perfilPrivilegio.deleteMany({
            where: { privilegio_id: priv.id },
        });
        await prisma.privilegio.delete({
            where: { id: priv.id },
        });

        delete cache[codigo];
        return Promise.resolve(0);
    }

    if (!priv || priv.nome !== nome || priv.modulo_id !== moduloId) {
        return prisma.privilegio.upsert({
            where: { codigo: codigo },
            update: { nome: nome, modulo_id: moduloId },
            create: {
                nome: nome,
                modulo_id: moduloId,
                codigo: codigo,
            },
        });
    }
    return priv;
}

async function atualizar_perfil_acesso() {
    const deletePerfilAcesso = async (perfilAcessoId: number) => {
        await prisma.pessoaPerfil.deleteMany({
            where: { perfil_acesso_id: perfilAcessoId },
        });

        await prisma.perfilPrivilegio.deleteMany({
            where: { perfil_acesso_id: perfilAcessoId },
        });

        await prisma.perfilAcesso.delete({
            where: { id: perfilAcessoId },
        });
    };

    const perfilAcessoInDb = await prisma.perfilAcesso.findMany({
        where: {
            autogerenciavel: true,
            removido_em: null,
        },
    });
    const perfilAcessoByNome: Record<string, (typeof perfilAcessoInDb)[0]> = {};
    for (const r of perfilAcessoInDb) {
        perfilAcessoByNome[r.nome] = r;
    }

    const privInDb = await prisma.privilegio.findMany();
    const privByCodigo: Record<string, (typeof privInDb)[0]> = {};
    for (const r of privInDb) {
        privByCodigo[r.codigo] = r;
    }

    const processPerfilAcessoConf = async (perfilAcessoConf: (typeof PerfilAcessoConfig)[0]) => {
        if (perfilAcessoConf.privilegios === false) {
            const perfilAcesso = perfilAcessoByNome[perfilAcessoConf.nome];
            if (perfilAcesso) {
                await deletePerfilAcesso(perfilAcesso.id);
            } else {
                console.error(`Não encontrado ${perfilAcessoConf.nome} para remover`);
            }
        } else {
            const perfilAcesso = await ensurePerfilAcessoIsEmpty(perfilAcessoConf, perfilAcessoByNome);

            const promises = perfilAcessoConf.privilegios.map((codPriv: ListaDePrivilegios) =>
                criaPrivComPerfilDeAcesso(codPriv, perfilAcesso, privByCodigo)
            );

            await Promise.all(promises);
        }
    };

    const processPerfilAcessoConfsInParallel = async () => {
        const promises = PerfilAcessoConfig.map(processPerfilAcessoConf);
        await Promise.all(promises);
    };

    // Call the parallel processing function
    await processPerfilAcessoConfsInParallel();
}

async function ensurePerfilAcessoIsEmpty(
    perfilAcessoConf: {
        nome: string;
        descricao: string;
        privilegios: ListaDePrivilegios[] | false;
    },
    cache: Record<string, PerfilAcesso>
) {
    let perfilAcesso = cache[perfilAcessoConf.nome];

    if (!perfilAcesso || perfilAcesso.descricao != perfilAcessoConf.descricao) {
        if (perfilAcesso) {
            await prisma.perfilAcesso.update({
                where: { id: perfilAcesso.id },
                data: {
                    nome: perfilAcessoConf.nome,
                    descricao: perfilAcessoConf.descricao,
                },
            });
        } else {
            perfilAcesso = await prisma.perfilAcesso.create({
                data: {
                    nome: perfilAcessoConf.nome,
                    descricao: perfilAcessoConf.descricao,
                    autogerenciavel: true,
                },
            });
        }
    } else {
        await prisma.perfilAcesso.update({
            where: { id: perfilAcesso.id },
            data: {
                nome: perfilAcessoConf.nome,
                descricao: perfilAcessoConf.descricao,
            },
        });
    }

    await prisma.perfilPrivilegio.deleteMany({
        where: {
            perfil_acesso_id: perfilAcesso.id,
            privilegio: Array.isArray(perfilAcessoConf.privilegios)
                ? {
                      codigo: { notIn: perfilAcessoConf.privilegios },
                  }
                : undefined,
        },
    });

    return perfilAcesso;
}

async function criaPrivComPerfilDeAcesso(
    codPriv: string,
    perfilAcesso: { id: number },
    cache: Record<string, Privilegio>
) {
    const priv = cache[codPriv];
    if (!priv) {
        throw new Error(`Não encontrado priv ${codPriv}`);
    }
    const idPriv = priv.id;

    const match = await prisma.perfilPrivilegio.findFirst({
        where: {
            perfil_acesso_id: perfilAcesso.id,
            privilegio_id: idPriv,
        },
    });
    if (!match) {
        await prisma.perfilPrivilegio.upsert({
            where: {
                perfil_acesso_id_privilegio_id: {
                    perfil_acesso_id: perfilAcesso.id,
                    privilegio_id: idPriv,
                },
            },
            create: {
                perfil_acesso_id: perfilAcesso.id,
                privilegio_id: idPriv,
            },
            update: {},
        });
    }
}

async function atualizar_superadmin() {
    await prisma.tipoOrgao.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            descricao: 'registro 1 do tipo orgao',
        },
    });

    await prisma.orgao.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            descricao: 'registro 1 do orgao',
            sigla: 'ID1',
            tipo_orgao_id: 1,
        },
    });

    const pessoa = await prisma.pessoa.upsert({
        where: { email: 'superadmin@admin.com' },
        update: {},
        create: {
            pessoa_fisica: {
                create: {
                    cargo: '',
                    cpf: '',
                    lotacao: '',
                    orgao_id: 1,
                },
            },
            senha_bloqueada: false,
            qtde_senha_invalida: 0,
            nome_completo: 'super admin',
            nome_exibicao: 'super admin',
            email: 'superadmin@admin.com',
            senha: '$2b$10$2DUUZc55NxezhEydgfUSTexk4.1qjbvb.873cZhCpIvjw4izkFqcW', // "!286!QDM7H",
        },
    });

    const idPerfilAcesso = (
        await prisma.perfilAcesso.findFirstOrThrow({ where: { nome: 'Administrador Geral do SMAE' } })
    ).id;

    let pessoaPerfilAdmin = await prisma.pessoaPerfil.findFirst({
        where: {
            pessoa_id: pessoa.id,
            perfil_acesso_id: idPerfilAcesso,
        },
    });
    if (!pessoaPerfilAdmin) {
        pessoaPerfilAdmin = await prisma.pessoaPerfil.create({
            data: {
                pessoa_id: pessoa.id,
                perfil_acesso_id: idPerfilAcesso,
            },
        });
    }
}

async function ensure_bot_user() {
    if ((await prisma.pessoa.count({ where: { id: -1 } })) == 0) {
        prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const pf = await prismaTx.pessoaFisica.create({
                data: {
                    cargo: '',
                    cpf: '',
                    lotacao: '',
                    orgao_id: 1,
                    registro_funcionario: '',
                },
                select: { id: true },
            });
            await prismaTx.pessoa.create({
                data: {
                    id: -1,
                    pessoa_fisica_id: pf.id,
                    senha_bloqueada: false,
                    qtde_senha_invalida: 0,
                    nome_completo: 'Robô/Sistema',
                    nome_exibicao: 'Robô/Sistema',
                    email: 'bot@email.com',
                    senha: '--',
                },
            });
        });
    }
}

async function populateEleicao() {
    const eleicoes: { ano: number; tipo: EleicaoTipo; atual_para_mandatos: boolean }[] = [
        { ano: 2020, tipo: EleicaoTipo.Municipal, atual_para_mandatos: true },
        { ano: 2022, tipo: EleicaoTipo.Estadual, atual_para_mandatos: true },
        { ano: 2024, tipo: EleicaoTipo.Municipal, atual_para_mandatos: false },
        { ano: 2026, tipo: EleicaoTipo.Estadual, atual_para_mandatos: false },
        { ano: 2028, tipo: EleicaoTipo.Municipal, atual_para_mandatos: false },
        { ano: 2030, tipo: EleicaoTipo.Estadual, atual_para_mandatos: false },
    ];

    for (const eleicao of eleicoes) {
        await prisma.eleicao.upsert({
            where: {
                tipo_ano: {
                    ano: eleicao.ano,
                    tipo: eleicao.tipo,
                },
            },
            create: {
                ano: eleicao.ano,
                tipo: eleicao.tipo,
                atual_para_mandatos: eleicao.atual_para_mandatos,
            },
            update: {
                ano: eleicao.ano,
                tipo: eleicao.tipo,
                atual_para_mandatos: eleicao.atual_para_mandatos,
            },
        });
    }
}

async function populateDistribuicaoStatusBase() {
    const rowsStatusesBase = [
        {
            'nome': 'Finalizada',
            'tipo': DistribuicaoStatusTipo.ConcluidoComSucesso,
            'valor_distribuicao_contabilizado': true,
            'permite_novos_registros': false,
        },
        {
            'nome': 'Em Andamento',
            'tipo': DistribuicaoStatusTipo.EmAndamento,
            'valor_distribuicao_contabilizado': true,
            'permite_novos_registros': true,
        },
        {
            'nome': 'Registrada',
            'tipo': DistribuicaoStatusTipo.NaoIniciado,
            'valor_distribuicao_contabilizado': true,
            'permite_novos_registros': true,
        },
        {
            'nome': 'Cancelada',
            'tipo': DistribuicaoStatusTipo.Terminal,
            'valor_distribuicao_contabilizado': false,
            'permite_novos_registros': false,
        },
        {
            'nome': 'Impedida Tecnicamente',
            'tipo': DistribuicaoStatusTipo.Terminal,
            'valor_distribuicao_contabilizado': false,
            'permite_novos_registros': false,
        },
        {
            'nome': 'Declinada',
            'tipo': DistribuicaoStatusTipo.Terminal,
            'valor_distribuicao_contabilizado': true,
            'permite_novos_registros': false,
        },
        {
            'nome': 'Redirecionada',
            'tipo': DistribuicaoStatusTipo.Terminal,
            'valor_distribuicao_contabilizado': false,
            'permite_novos_registros': false,
        },
    ];

    for (const row of rowsStatusesBase) {
        await prisma.distribuicaoStatusBase.upsert({
            where: {
                nome_tipo: {
                    nome: row.nome,
                    tipo: row.tipo,
                },
            },
            create: {
                nome: row.nome,
                tipo: row.tipo,
                valor_distribuicao_contabilizado: row.valor_distribuicao_contabilizado,
                permite_novos_registros: row.permite_novos_registros,
            },
            update: {
                nome: row.nome,
                tipo: row.tipo,
                valor_distribuicao_contabilizado: row.valor_distribuicao_contabilizado,
                permite_novos_registros: row.permite_novos_registros,
            },
        });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
