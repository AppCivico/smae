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
    CONST_COD_NOTA_TRANSF_GOV,
    CONST_CRONO_VAR_CATEGORICA_ID,
    CONST_TIPO_NOTA_DIST_RECURSO,
    CONST_TIPO_NOTA_TRANSF_GOV,
    CONST_VAR_SEM_UN_MEDIDA,
    CONST_PERFIL_PARTICIPANTE_EQUIPE,
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
    CadastroPainelExternoRegra: ['Escolha do painel externo', ['SMAE', 'PDM', 'PlanoSetorial', 'Projetos', 'MDO']],
    CadastroPainelExterno: ['Painéis Externos', 'SMAE'],
    CadastroGrupoPainelExterno: ['Grupos de Painéis Externos', 'SMAE'],

    CadastroUnidadeMedida: ['Unidades de Medida', 'SMAE'],

    CadastroPdm: ['Programa de Metas', 'PDM'],
    CadastroOds: ['Categorias', 'SMAE'],
    CadastroTag: ['Tags', 'PDM'],
    CadastroMacroTema: ['Macro Temas', 'PDM'],
    CadastroSubTema: ['Sub Temas', 'PDM'],
    CadastroTema: ['Temas', 'PDM'],
    CadastroMeta: ['Metas', 'PDM'],
    CadastroIndicador: ['Indicadores', 'PDM'],
    CadastroVariavelCategorica: ['Variável Categórica', 'PlanoSetorial'],
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

    ModalidadeContratacao: ['Modalidade de Contratação', ['SMAE']],
    TipoAditivo: ['Tipo Aditivo', ['SMAE']],

    ProjetoProgramaMDO: ['Programas', 'MDO'],

    CadastroVariavelGlobal: ['Variáveis Globais', 'PlanoSetorial'], // depois vai ter o PDM
    CadastroGrupoVariavel: ['Grupos de Variáveis', ['PlanoSetorial']], // depois vai ter o PDM
    CadastroEquipamentoMDO: ['Equipamentos', 'MDO'],
    CadastroEmpreendimentoMDO: ['Empreendimentos', 'MDO'],
    TipoIntervecaoMDO: ['Tipo de Intervenção', 'MDO'],
    GrupoTematicoMDO: ['Grupo Temático', 'MDO'],
    CadastroTransferenciaTipo: ['Tipos de Transferência', 'CasaCivil'],

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
    CadastroClassificacao: ['Cadastro de Classificacao', 'CasaCivil'],
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

    CadastroTransferenciaTipo: [
        ['CadastroTransferenciaTipo.inserir', 'Inserir Transferência Tipo'],
        ['CadastroTransferenciaTipo.editar', 'Editar Transferência Tipo'],
        ['CadastroTransferenciaTipo.remover', 'Remover Transferência Tipo'],
    ],

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
        ['AssuntoVariavel.inserir', 'Inserir Assunto de Variável e Categoria de Assunto'],
        ['AssuntoVariavel.editar', 'Editar Assunto de Variável e Categoria de Assunto'],
        ['AssuntoVariavel.remover', 'Remover Assunto de Variável e Categoria de Assunto'],
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
    CadastroEquipamentoMDO: [
        ['CadastroEquipamentoMDO.inserir', 'Inserir Equipamento'],
        ['CadastroEquipamentoMDO.editar', 'Editar Equipamento'],
        ['CadastroEquipamentoMDO.remover', 'Remover Equipamento'],
    ],
    CadastroEmpreendimentoMDO: [
        ['CadastroEmpreendimentoMDO.inserir', 'Inserir Empreendimento'],
        ['CadastroEmpreendimentoMDO.editar', 'Editar Empreendimento'],
        ['CadastroEmpreendimentoMDO.remover', 'Remover Empreendimento'],
    ],
    TipoIntervecaoMDO: [
        ['TipoIntervecaoMDO.inserir', 'Inserir Tipo de Intervenção'],
        ['TipoIntervecaoMDO.editar', 'Editar Tipo de Intervenção'],
        ['TipoIntervecaoMDO.remover', 'Remover Tipo de Intervenção'],
    ],

    GrupoTematicoMDO: [
        ['GrupoTematicoMDO.inserir', 'Inserir Grupo Temático'],
        ['GrupoTematicoMDO.editar', 'Editar Grupo Temático'],
        ['GrupoTematicoMDO.remover', 'Remover Grupo Temático'],
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
            'CadastroMeta.administrador_no_pdm_admin_cp',
            '[Uso interno para Administrar Metas, Iniciativas, Atividades, Indicadores, Cronogramas/Etapas e Painéis do PDM.]',
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
        ['CadastroTransferencia.dashboard', 'Ver dashboard de Transferências'],
        ['TransfereGov.listar', 'Listar oportunidades e comunicados do TransfereGov'],
        ['TransfereGov.atualizar', 'Atualizar oportunidades do TransfereGov'],
        ['TransfereGov.sincronizar', 'Sincronizar oportunidades e comunicados do TransfereGov'],
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
    CadastroPainelExternoRegra: [
        ['SMAE.espectador_de_painel_externo', 'Visualizador de painel externo'],
    ],
    Config: [
        ['SMAE.sysadmin', 'SMAE.sysadmin'],
        ['SMAE.login_suspenso', 'Impede o login do usuário, mas mantém os dados e possibilidade ser responsável'],
        ['Config.editar', 'Editar configuração de textos do sistema'],
        ['SMAE.superadmin', 'Faz parte do perfil de Administrador Geral'],
        ['SMAE.loga_direto_na_analise', 'Acesso direto à parte de análise ao fazer login'],
        ['SMAE.acesso_bi', 'Acesso total aos Business Intelligence (BI) de projetos/metas'],
        ['PerfilAcesso.administrador', 'Gerenciar Perfil de Acesso'],
        ['SMAE.gestor_distribuicao_recurso', 'Visão limitada, para gestor de distribuição de recurso'],
    ],
    CadastroGrupoVariavel: [
        ['CadastroGrupoVariavel.administrador', 'Gerenciar todas as equipes'],
        ['CadastroGrupoVariavel.colaborador_responsavel', 'Gerenciar Equipes onde é responsável'],
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
        ['MDO.revisar_obra', 'Revisar obras'],
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
    CadastroClassificacao: [
        ['CadastroClassificacao.editar', 'Editar Classificação'],
        ['CadastroClassificacao.inserir', 'Incluir Classificação'],
        ['CadastroClassificacao.listar', 'Listar Classificações'],
        ['CadastroClassificacao.remover', 'Excluir Classificações'],
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

const SMAECadastroBasico: ListaDePrivilegios[] = [
    'CadastroOrgao.inserir',
    'CadastroOrgao.editar',
    'CadastroOrgao.remover',

    'CadastroTipoDocumento.editar',
    'CadastroTipoDocumento.inserir',
    'CadastroTipoDocumento.remover',

    'CadastroPainelExterno.inserir',
    'CadastroPainelExterno.editar',
    'CadastroPainelExterno.remover',

    'CadastroUnidadeMedida.inserir',
    'CadastroUnidadeMedida.editar',
    'CadastroUnidadeMedida.remover',

    'CadastroRegiao.inserir',
    'CadastroRegiao.editar',
    'CadastroRegiao.remover',
];

const PDMCadastroBasico: ListaDePrivilegios[] = [
    // ODS são as categorias no PDM
    'CadastroOds.inserir',
    'CadastroOds.editar',
    'CadastroOds.remover',

    'CadastroPainel.inserir',
    'CadastroPainel.editar',
    'CadastroPainel.remover',
    'CadastroPainel.visualizar',

    ...SMAECadastroBasico,
] as const;

const TVCadastroBasico: ListaDePrivilegios[] = [
    'CadastroPartido.editar',
    'CadastroPartido.inserir',
    'CadastroPartido.remover',

    'CadastroPainelExterno.inserir',
    'CadastroPainelExterno.editar',
    'CadastroPainelExterno.remover',

    'CadastroClassificacao.editar',
    'CadastroClassificacao.inserir',
    'CadastroClassificacao.remover',
    'CadastroClassificacao.listar',

    'CadastroTransferenciaTipo.inserir',
    'CadastroTransferenciaTipo.editar',
    'CadastroTransferenciaTipo.remover',

    ...SMAECadastroBasico,
    // Tipo de Transferência
    // Classificação
] as const;

const PrivRespNaCp: ListaDePrivilegios[] = [
    'PDM.coordenador_responsavel_cp',
    'PDM.tecnico_cp',
    'CadastroMeta.listar',
    'CadastroMeta.administrador_no_pdm',
    ...PDMCadastroBasico,
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

    // ODS é Categoria
    'CadastroOds.inserir',
    'CadastroOds.editar',
    'CadastroOds.remover',

    'FonteVariavel.inserir',
    'FonteVariavel.editar',
    'FonteVariavel.remover',

    'AssuntoVariavel.inserir',
    'AssuntoVariavel.editar',
    'AssuntoVariavel.remover',

    ...SMAECadastroBasico,
];

const PSMetasReportsEAdmin: ListaDePrivilegios[] = [
    'CadastroMetaPS.administrador_no_pdm',
    'CadastroMetaPS.administrador_orcamento',
    'CadastroMetaPS.listar',

    //    'CadastroPainelPS.inserir',
    //    'CadastroPainelPS.editar',
    //    'CadastroPainelPS.remover',
    //    'CadastroPainelPS.visualizar',

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

type PerfilConfigArray = {
    nome: string;
    descricao: string;
    privilegios: ListaDePrivilegios[] | false;
}[];

const MDOCadastroBasico: ListaDePrivilegios[] = [
    'CadastroProjetoEtapaMDO.inserir',
    'CadastroProjetoEtapaMDO.editar',
    'CadastroProjetoEtapaMDO.remover',

    // tag é etiquetas
    'ProjetoTagMDO.inserir',
    'ProjetoTagMDO.editar',
    'ProjetoTagMDO.remover',

    'ModalidadeContratacao.inserir',
    'ModalidadeContratacao.editar',
    'ModalidadeContratacao.remover',

    'TipoAditivo.inserir',
    'TipoAditivo.editar',
    'TipoAditivo.remover',

    'TipoIntervecaoMDO.inserir',
    'TipoIntervecaoMDO.editar',
    'TipoIntervecaoMDO.remover',

    'GrupoTematicoMDO.inserir',
    'GrupoTematicoMDO.editar',
    'GrupoTematicoMDO.remover',

    'CadastroEquipamentoMDO.inserir',
    'CadastroEquipamentoMDO.editar',
    'CadastroEquipamentoMDO.remover',

    'CadastroEmpreendimentoMDO.inserir',
    'CadastroEmpreendimentoMDO.editar',
    'CadastroEmpreendimentoMDO.remover',

    // programa habitacional
    'ProjetoProgramaMDO.inserir',
    'ProjetoProgramaMDO.editar',
    'ProjetoProgramaMDO.remover',
] as const;

const PPCadastroBasico: ListaDePrivilegios[] = [
    'CadastroProjetoEtapa.inserir',
    'CadastroProjetoEtapa.editar',
    'CadastroProjetoEtapa.remover',

    'ModalidadeContratacao.inserir',
    'ModalidadeContratacao.editar',
    'ModalidadeContratacao.remover',

    'TipoAditivo.inserir',
    'TipoAditivo.editar',
    'TipoAditivo.remover',
] as const;

const PerfilAcessoConfig: PerfilConfigArray = [
    // toda vez que mudar o nome de algum item, é necessário adicionar o label antigo usando o
    // metodo atualizarNomePerfil e depois jogar no final aqui o removerNomePerfil
    {
        // o TipoAditivo vai ficar fora do "todos os privilégios"
        nome: atualizarNomePerfil('Administrador Geral do SMAE', ['Administrador Geral']),
        descricao: 'Administrador Geral - Todas as permissões do sistema, exceto regras de negócio específicas.',
        privilegios: ['SMAE.superadmin', ...todosPrivilegios.filter((e) => /^(PDM|SMAE|PS|MDO)\./.test(e) === false)],
    },
    {
        nome: 'SYSADMIN',
        descricao: 'Endpoints especiais do sistema',
        privilegios: ['SMAE.sysadmin'],
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
            'CadastroMeta.administrador_orcamento',

            ...PDMCadastroBasico,

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
            'CadastroMeta.administrador_no_pdm',
            'CadastroMeta.administrador_no_pdm_admin_cp', // pq ele é admin_cp, vai poder editar varias coisas
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
        nome: 'Ponto Focal',
        descricao: 'Vê somente as metas onde há dados para registrar evolução no ciclo corrente',
        privilegios: ['PDM.ponto_focal', 'CadastroMeta.listar', 'CadastroPainel.visualizar'],
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
        nome: atualizarNomePerfil('Orçamento - Metas', ['Orçamento']),
        descricao: 'Pode criar orçamento para as metas que tem acesso.',
        privilegios: ['CadastroMeta.orcamento'],
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
        nome: 'Gestor de Projetos no Órgão',
        descricao: 'Gerenciar todos os projetos no órgão em qual faz parte',
        privilegios: [
            'Reports.executar.Projetos', // TODO remover, afinal, precisa dos filtros no reports
            'Projeto.administrador_no_orgao',
            'Reports.dashboard_portfolios',
            'Projeto.administrar_portfolios_no_orgao',
            'CadastroGrupoPortfolio.administrador_no_orgao',
            'Projeto.orcamento',
            ...PPCadastroBasico,
        ],
    },

    {
        nome: atualizarNomePerfil('Gestor de Cadastros Básicos de Projetos', [
            'Gestor de Cadastros Básicos de Projetos e Obras',
        ]),
        descricao:
            'Responsável por gerenciar os cadastros básicos de projetos, incluindo a criação, edição e remoção de etapas, modalidades de contratação, e tipos de aditivo. ',
        privilegios: [...PPCadastroBasico],
    },

    {
        nome: 'Gestor de Cadastros Básicos de Obras',
        descricao:
            'Responsável por gerenciar os cadastros básicos de projetos e obras, incluindo a criação, edição e remoção de etapas, modalidades de contratação, etiquetas, equipamentos, empreendimentos, programas habitacionais, tipos de intervenção e grupos temáticos.',
        privilegios: [...MDOCadastroBasico],
    },

    {
        nome: 'Administrador do Módulo de Obras',
        descricao: 'Gerenciar cadastros básicos e acesso irrestrito às obras',
        privilegios: ['ProjetoMDO.administrador', 'CadastroPessoa.administrador', ...MDOCadastroBasico],
    },
    {
        nome: 'Gestor de Obras no Órgão',
        descricao: 'Gerenciar todos as obras no órgão em qual faz parte',
        privilegios: [
            'ProjetoTagMDO.inserir',
            'ProjetoTagMDO.editar',
            'ProjetoTagMDO.remover',
            'Reports.executar.MDO', // TODO remover, afinal, precisa dos filtros no reports
            'ProjetoMDO.administrador_no_orgao',
            // 'Reports.dashboard_mdo',
            'ProjetoMDO.administrar_portfolios_no_orgao',
            'CadastroGrupoPortfolioMDO.administrador_no_orgao',
            'MDO.revisar_obra',
            'ProjetoMDO.orcamento',

            ...MDOCadastroBasico,
        ],
    },
    {
        nome: atualizarNomePerfil('Gestor de projetos', ['Órgão Gestor']),
        descricao: 'Pode ser escolhido como responsável no órgão gestor de projetos',
        privilegios: [
            'Reports.executar.Projetos', // TODO remover, afinal, precisa dos filtros no reports
            'SMAE.gestor_de_projeto',
            'Reports.dashboard_portfolios',
            'Projeto.orcamento',
        ],
    },
    {
        nome: atualizarNomePerfil('Gestor da Obra', []),
        descricao: 'Pode ser escolhido como responsável no órgão gestor de MdO',
        privilegios: [
            'ProjetoTagMDO.inserir',
            'ProjetoTagMDO.editar',
            'MDO.revisar_obra',
            'ProjetoTagMDO.remover',
            'Reports.executar.MDO', // TODO remover, afinal, precisa dos filtros no reports
            'MDO.gestor_de_projeto',
            'Reports.dashboard_mdo',
            'ProjetoMDO.orcamento',
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
            'Reports.executar.Projetos', // TODO remover, afinal, precisa dos filtros no reports
            'SMAE.colaborador_de_projeto',
            'Reports.dashboard_portfolios',
            'Projeto.orcamento',
        ],
    },
    {
        nome: 'Colaborador de obra no órgão',
        descricao:
            'Pode ser escolhido como responsável no órgão responsável pela obra e contribuir durante a fase de registro e planejamento, e dados de execução do cronograma e acompanhamento do risco',
        privilegios: [
            'Reports.executar.MDO', // TODO remover, afinal, precisa dos filtros no reports
            'MDO.colaborador_de_projeto',
            'MDO.revisar_obra',
            'Reports.dashboard_mdo',
            'CadastroProjetoEtapaMDO.inserir',
            'CadastroProjetoEtapaMDO.editar',
            'CadastroProjetoEtapaMDO.remover',
            'ProjetoMDO.orcamento',
        ],
    },
    {
        nome: 'Analista de dados',
        descricao: 'Tem acesso aos dashboards e painéis externos de metas e projetos',
        privilegios: [
            //'SMAE.loga_direto_na_analise', não é mais necessário no SMAE de 2024/10
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
        privilegios: ['MDO.espectador_de_projeto', 'MDO.revisar_obra'],
    },
    {
        nome: atualizarNomePerfil('Observador de painéis externos', []),
        descricao: 'Pode participar como leitor em painéis externos',
        privilegios: ['SMAE.espectador_de_painel_externo'],
    },
    {
        nome: atualizarNomePerfil('Administrador Transferências Voluntárias', ['Administrador Casa Civil']),
        descricao: 'Visualizar o telefone de parlamentares',
        privilegios: ['SMAE.acesso_telefone'],
    },
    {
        nome: atualizarNomePerfil('Gestor Transferências Voluntárias', ['Gestor Casa Civil']),
        descricao: 'Pode gerir entidades em Casa Civil',
        privilegios: [
            //            'CadastroBancada.editar',
            //            'CadastroBancada.inserir',
            //            'CadastroBancada.remover',
            //            'CadastroPartido.editar',
            ...TVCadastroBasico,
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
            'TransfereGov.atualizar',
            'TransfereGov.listar',
            'TransfereGov.sincronizar',
            'CadastroTransferencia.dashboard',
        ],
    },
    {
        nome: 'Gestor de Distribuição de Recurso',
        descricao: 'Pode visualizar todas as distribuições de recurso para seu órgão.',
        privilegios: [
            // Privs utilizadas para refinamento de controle de permissão em endpoints que possuem "pode_editar".
            'SMAE.gestor_distribuicao_recurso',

            'CadastroTransferencia.listar',
            'CadastroClassificacao.listar',
            'AndamentoWorkflow.listar',
            // TODO? Maybe precisa ter permissões para editar e remover, e ai precisaria melhorar
            // o "pode_editar" do crono
            'CadastroCronogramaTransferencia.listar',
        ],
    },
    {
        nome: atualizarNomePerfil('Gestor de usuários no mesmo órgão', ['Coordenadoria de Planejamento']),
        descricao: 'Pode criar e editar usuários no mesmo órgão',
        privilegios: [
            'CadastroPessoa.inserir',
            'CadastroPessoa.editar',
            'CadastroPessoa.inativar',
            'CadastroPessoa.ativar',
            'CadastroGrupoVariavel.colaborador_responsavel',
        ],
    },
];

// Perfis de Plano Setoriais
PerfilAcessoConfig.push(
    {
        nome: atualizarNomePerfil('Administrador Geral dos Planos Setoriais', [
            'Administrador Geral do Plano Setorial',
            'Administrador **Geral** do Plano Setorial',
            'Administrador Geral de Plano Setorial',
        ]),
        descricao: 'Acesso irrestrito aos Planos Setoriais e Banco de Variáveis.',
        privilegios: [
            'CadastroPS.administrador', // bloquear criação se não tiver já a mesma permissão no PDM
            'CadastroVariavelGlobal.administrador',
            'CadastroVariavelCategorica.administrador',
            ...PSCadastroBasico, // Tema, Tags, etc...
            ...PSMetasReportsEAdmin, // Metas, Reports, Painel
        ],
    },

    {
        nome: atualizarNomePerfil('Administrador de Plano Setorial no órgão', []),
        descricao: 'Acesso restrito aos Planos Setoriais e Banco de Variáveis do próprio órgão ao qual pertence.',
        privilegios: [
            'PS.admin_cp',
            'CadastroPS.administrador_no_orgao', // so pode criar no orgao_admin dele
            'CadastroVariavelGlobal.administrador_no_orgao',

            // faltando equipe , painel externo
            ...PSCadastroBasico, // Tema, Tags, etc...
            ...PSMetasReportsEAdmin, // Metas, Reports, Painel
        ],
    },

    {
        nome: atualizarNomePerfil('Responsável em equipes', ['Colaborador de Grupo de Variáveis']),
        descricao: 'Gerenciar as equipes onde é responsável',
        privilegios: ['CadastroGrupoVariavel.colaborador_responsavel', 'SMAE.GrupoVariavel.colaborador'],
    },

    {
        nome: atualizarNomePerfil(CONST_PERFIL_PARTICIPANTE_EQUIPE, ['Participante de Grupo de Variáveis']),
        descricao:
            'Pode ser participante de equipes, podendo ter qualquer perfil (Administrador de plano, Coleta, Conferencia, Liberação, Ponto Focal e Técnico)',
        privilegios: [
            'SMAE.GrupoVariavel.participante', // informativo para saber que pode participar, filtro das pessoas
            'PS.admin_cp', // backcompat. com frontend
            'PS.tecnico_cp', // backcompat. com frontend
            'PS.ponto_focal', // backcompat. com frontend
            'CadastroMetaPS.listar', // grant da listagem do PDM e Metas/ini/etc
            'CadastroPainelPS.visualizar', // nao ta sendo usado
        ],
    },

    {
        nome: atualizarNomePerfil('Orçamento - Metas Setorial', ['Orçamento']),
        descricao: 'Pode utilizar o orçamento para as metas que participa, não pode reabrir o orçamento.',
        privilegios: ['CadastroMetaPS.orcamento'],
    }
);

// Remover os perfis que não são mais utilizados
PerfilAcessoConfig.push(
    removerNomePerfil('Orçamento - Projetos'),
    removerNomePerfil('Orçamento - MdO'),
    removerNomePerfil('Administrador Coordenadoria de Planejamento Setorial'),
    removerNomePerfil('Ponto Focal Setorial'),
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
    removerNomePerfil('Responsável por meta na Coordenadoria de Planejamento Setorial'),
    removerNomePerfil('Administrador de Plano Setorial'),
    removerNomePerfil('Administrador de equipes')
);

async function main() {
    if (atualizacoesPerfil.length) await Promise.all(atualizacoesPerfil);

    await prisma.$transaction(
        async (prismaTx: Prisma.TransactionClient) => {
            const locked: { locked: boolean }[] =
                await prismaTx.$queryRaw`SELECT pg_try_advisory_xact_lock(${JOB_LOCK_NUMBER}) as locked`;

            if (!locked[0].locked) return;

            await criar_emaildb_config();
            await criar_texto_config();
            await atualizar_modulos_e_privilegios();
            await atualizar_perfil_acesso();

            await atualizar_superadmin();
            await ensure_bot_user();

            await Promise.allSettled([
                ensure_categorica_cronograma(),
                ensure_tiponota_dist_recurso(),
                ensure_tiponota_transf_gov(),
                populateEleicao(),
                populateDistribuicaoStatusBase(),
                ensure_var_sem_unidade_medida(),
            ]);

            await prismaTx.$queryRaw`select f_update_modulos_sistemas();`;
        },
        {
            maxWait: 1000,
            timeout: 60 * 1000,
        }
    );
}

async function ensure_tiponota_transf_gov() {
    await prisma.tipoNota.upsert({
        where: { id: CONST_TIPO_NOTA_TRANSF_GOV },
        create: {
            id: CONST_TIPO_NOTA_TRANSF_GOV,
            codigo: CONST_COD_NOTA_TRANSF_GOV,
            autogerenciavel: true,

            permite_email: false,
            visivel_resp_orgao: false,
            eh_publico: true,
            permite_enderecamento: false,
            permite_replica: false,
            permite_revisao: false,
        },
        update: {
            eh_publico: true,
            codigo: CONST_COD_NOTA_DIST_RECURSO,
        },
    });
}

async function ensure_var_sem_unidade_medida() {
    await prisma.unidadeMedida.upsert({
        where: { id: CONST_VAR_SEM_UN_MEDIDA },
        create: {
            id: CONST_VAR_SEM_UN_MEDIDA,
            descricao: 'Sem unidade de medida',
            sigla: '',
        },
        update: {},
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

const removidosNaSession = new Set<number>();
async function atualizar_perfil_acesso() {
    const deletePerfilAcesso = async (perfilAcessoId: number) => {
        await prisma.pessoaPerfil.deleteMany({
            where: { perfil_acesso_id: perfilAcessoId },
        });

        await prisma.perfilPrivilegio.deleteMany({
            where: { perfil_acesso_id: perfilAcessoId },
        });

        if (removidosNaSession.has(perfilAcessoId)) return;
        removidosNaSession.add(perfilAcessoId);
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
