import { EleicaoTipo, ModuloSistema, PerfilAcesso, Prisma, PrismaClient, Privilegio } from '@prisma/client';
import { ListaDePrivilegios } from '../src/common/ListaDePrivilegios';
import { CONST_CRONO_VAR_CATEGORICA_ID } from '../src/common/consts';
const prisma = new PrismaClient({ log: ['query'] });

const ModuloDescricao: Record<string, [string, ModuloSistema | null]> = {
    CadastroOrgao: ['Órgãos', 'SMAE'],
    CadastroTipoOrgao: ['Tipos de Órgãos', 'SMAE'],
    CadastroPessoa: ['Pessoas', 'SMAE'],
    CadastroOds: ['Categorias', 'PDM'],
    CadastroPdm: ['Programa de Metas', 'PDM'],
    CadastroFonteRecurso: ['Fontes de Recurso', 'SMAE'],
    CadastroTipoDocumento: ['Tipos de Arquivo', 'SMAE'],
    CadastroTag: ['Tags', 'PDM'],
    CadastroMacroTema: ['Macro Temas', 'PDM'],
    CadastroSubTema: ['Sub Temas', 'PDM'],
    CadastroTema: ['Temas', 'PDM'],
    CadastroRegiao: ['Regiões', 'SMAE'],
    CadastroMeta: ['Metas', 'PDM'],
    CadastroIndicador: ['Indicadores', 'PDM'],
    CadastroVariavelCategorica: ['Variável Categórica', 'PDM'],
    CadastroUnidadeMedida: ['Unidades de Medida', 'PDM'],
    CadastroIniciativa: ['Iniciativas', 'PDM'],
    CadastroAtividade: ['Atividades', 'PDM'],
    CadastroCronograma: ['Cronogramas', 'PDM'],
    CadastroPainel: ['Painéis', 'PDM'],
    CadastroGrupoPaineis: ['Grupos de Painéis', 'PDM'],
    CadastroGrupoPortfolio: ['Grupos de Portfólio', 'Projetos'],
    CadastroPainelExterno: ['Painéis Externos', 'SMAE'],
    CadastroGrupoPainelExterno: ['Grupos de Painéis Externos', 'SMAE'],
    Config: ['Configurações', 'SMAE'],
    Reports: ['Relatórios', 'SMAE'],
    ReportsProjetos: ['Relatórios de Projetos', 'Projetos'],
    ReportsPdm: ['Relatórios de PDM', 'PDM'],
    ReportsCasaCivil: ['Relatórios de Transferências Voluntárias', 'CasaCivil'],
    Projeto: ['Projetos', 'Projetos'],
    PDM: ['Regras de Negócio do Programas de Metas', 'PDM'],
    SMAE: ['Regras de Negócio do SMAE', 'SMAE'],
    PerfilAcesso: ['Gerenciar Perfil de Acesso', 'SMAE'],
    CadastroPartido: ['Partidos', 'CasaCivil'],
    CadastroBancada: ['Bancadas', 'CasaCivil'],
    CadastroParlamentar: ['Parlamentares', 'CasaCivil'],
    CadastroTransferencia: ['Transferências', 'CasaCivil'],
    CadastroWorkflow: ['Workflows', 'CasaCivil'],
    CadastroProjetoEtapa: ['Etapas', 'Projetos'],
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

    CadastroGrupoPortfolio: [
        ['CadastroGrupoPortfolio.administrador', 'Gerenciar Grupos de Portfólio de qualquer órgão'],
        ['CadastroGrupoPortfolio.administrador_no_orgao', 'Gerenciar Grupos de Portfólio do órgão ao qual pertence'],
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
    CadastroTema: [
        ['CadastroTema.inserir', 'Inserir Tema'],
        ['CadastroTema.editar', 'Editar Tema'],
        ['CadastroTema.remover', 'Remover Tema'],
    ],
    CadastroSubTema: [
        ['CadastroSubTema.inserir', 'Inserir SubTema'],
        ['CadastroSubTema.editar', 'Editar SubTema'],
        ['CadastroSubTema.remover', 'Remover SubTema'],
    ],
    CadastroTag: [
        ['CadastroTag.inserir', 'Inserir Tag'],
        ['CadastroTag.editar', 'Editar Tag'],
        ['CadastroTag.remover', 'Remover Tag'],
    ],
    CadastroProjetoEtapa: [
        ['CadastroProjetoEtapa.inserir', 'Inserir cadastro básico de Etapa'],
        ['CadastroProjetoEtapa.editar', 'Editar cadastro básico de Etapa'],
        ['CadastroProjetoEtapa.remover', 'Remover cadastro básico de Etapa'],
    ],
    CadastroMeta: [
        // de fato, esse é o administrador, mas o frontend já usava o código CadastroMeta.inserir
        // quando tem essa permissão, é liberado vários outros itens
        [
            'CadastroMeta.inserir',
            'Administrar Metas, Iniciativas, Atividades, Indicadores, Cronogramas/Etapas e Painéis.',
        ],
        ['CadastroMeta.editar', 'Editar Metas pelas quais for responsável'],
        ['CadastroMeta.remover', 'Remover Metas pelas quais for responsável'],
        [
            'CadastroMeta.administrador_orcamento',
            'Atualizar a Execução Orçamentária de todas as metas e desmarcar orçamento realizado como concluído',
        ],
        ['CadastroMeta.orcamento', 'Atualizar a Execução Orçamentária pelas quais for responsável'],
        ['CadastroMeta.listar', 'Listar metas, iniciativas e atividades'],
    ],
    CadastroIndicador: [
        // quem puder editar ou inserir indicador, vai poder gerenciar as variáveis
        ['CadastroIndicador.inserir', 'Inserir Indicadores e variáveis quando for responsável'],
        ['CadastroIndicador.editar', 'Editar Indicadores e variáveis quando for responsável'],
        ['CadastroIndicador.remover', 'Remover Indicadores e variáveis quando for responsável'],
    ],
    CadastroVariavelCategorica: [
        ['CadastroVariavelCategorica.administrador', 'Inserir, Editar e Remover e variáveis categóricas'],
    ],
    CadastroIniciativa: [
        ['CadastroIniciativa.inserir', 'Inserir Iniciativas pelas quais for responsável'],
        ['CadastroIniciativa.editar', 'Editar Iniciativas pelas quais for responsável'],
        ['CadastroIniciativa.remover', 'Remover Iniciativas pelas quais for responsável'],
    ],
    CadastroAtividade: [
        ['CadastroAtividade.inserir', 'Inserir Atividades pelas quais for responsável'],
        ['CadastroAtividade.editar', 'Editar Atividades pelas quais for responsável'],
        ['CadastroAtividade.remover', 'Remover Atividades pelas quais for responsável'],
    ],
    CadastroCronograma: [
        ['CadastroCronograma.inserir', 'Inserir Cronogramas pelos quais for responsável'],
        ['CadastroCronograma.editar', 'Editar Cronogramas pelos quais for responsável'],
        ['CadastroCronograma.remover', 'Remover Cronogramas pelos quais for responsável'],
    ],
    CadastroPainel: [
        ['CadastroPainel.visualizar', 'Visualizar Painéis e detalhes do conteúdo'],
        ['CadastroPainel.inserir', 'Inserir Painéis pelos quais for responsável'],
        ['CadastroPainel.editar', 'Editar Painéis pelos quais for responsável'],
        ['CadastroPainel.remover', 'Remover Painéis pelos quais for responsável'],
    ],
    CadastroGrupoPaineis: [
        ['CadastroGrupoPaineis.inserir', 'Inserir Grupo de Painéis'],
        ['CadastroGrupoPaineis.editar', 'Editar Grupo de Painéis'],
        ['CadastroGrupoPaineis.remover', 'Remover Grupo de Painéis'],
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
    ReportsProjetos: [
        ['Reports.dashboard_portfolios', 'Dashboard de portfólios'],
        ['Reports.executar.Projetos', 'Executar relatórios de projetos'],
        ['Reports.remover.Projetos', 'Executar relatórios de projetos'],
    ],
    ReportsCasaCivil: [
        ['Reports.executar.CasaCivil', 'Executar relatórios de transferências voluntárias'],
        ['Reports.remover.CasaCivil', 'Executar relatórios de transferências voluntárias'],
    ],
    PerfilAcesso: [['PerfilAcesso.administrador', false]],
    Config: [
        ['Config.editar', 'Editar configuração de textos do sistema'],
        ['SMAE.superadmin', 'Faz parte do perfil de Administrador Geral'],
        ['SMAE.loga_direto_na_analise', 'Acesso direto à parte de análise ao fazer login'],
        ['SMAE.acesso_bi', 'Acesso total aos Business Intelligence (BI) de projetos/metas'],
        ['SMAE.espectador_de_painel_externo', 'Visualizador de painel externo'],
        ['PerfilAcesso.administrador', 'Gerenciar Perfil de Acesso'],
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
    PDM: [
        ['PDM.coordenador_responsavel_cp', 'Pode ser designado como Coordenador Responsável na CP'],
        ['PDM.tecnico_cp', 'Monitoramento - Técnico CP'],
        ['PDM.admin_cp', 'Monitoramento - Administrador CP'],
        ['PDM.ponto_focal', 'Monitoramento - Ponto Focal'],
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
    'CadastroMeta.editar',
    'CadastroMeta.remover',
    'CadastroIndicador.inserir',
    'CadastroIndicador.editar',
    'CadastroIndicador.remover',
    'CadastroIniciativa.inserir',
    'CadastroIniciativa.editar',
    'CadastroIniciativa.remover',
    'CadastroAtividade.inserir',
    'CadastroAtividade.editar',
    'CadastroAtividade.remover',
    'CadastroCronograma.inserir',
    'CadastroCronograma.editar',
    'CadastroCronograma.remover',
    'CadastroPainel.inserir',
    'CadastroPainel.editar',
    'CadastroPainel.remover',
    'CadastroPainel.visualizar',
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
        nome: atualizarNomePerfil('Administrador Geral do SMAE', ['Administrador Geral']),
        descricao: 'Administrador Geral - Todas as permissões do sistema, exceto monitoramento e gerência de projeto',
        privilegios: ['SMAE.superadmin', ...todosPrivilegios.filter((e) => /^(PDM|SMAE)\./.test(e) === false)],
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
            'CadastroMeta.inserir', // pq ele é admin_cp, vai poder editar varias coisas
            'CadastroMeta.listar',
            'CadastroMeta.editar',
            'CadastroMeta.remover',
            'CadastroIndicador.inserir',
            'CadastroIndicador.editar',
            'CadastroIndicador.remover',
            'CadastroIniciativa.inserir',
            'CadastroIniciativa.editar',
            'CadastroIniciativa.remover',
            'CadastroAtividade.inserir',
            'CadastroAtividade.editar',
            'CadastroAtividade.remover',
            'CadastroCronograma.inserir',
            'CadastroCronograma.editar',
            'CadastroCronograma.remover',
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
        nome: 'Orçamento - Projetos',
        descricao: 'Pode criar orçamento para os projetos que tem acesso.',
        privilegios: ['Projeto.orcamento'],
    },
    {
        nome: 'Administrador de Portfólio',
        descricao: 'Gerenciar os Portfólios',
        privilegios: [
            'Projeto.administrar_portfolios',
            'CadastroGrupoPortfolio.administrador', // verificar se vamos criar um novo perfil para essa
        ],
    },
    {
        nome: 'Gestor de Projetos no Órgão',
        descricao: 'Gerenciar todos os projetos no órgão em qual faz parte',
        privilegios: [
            'Reports.executar.Projetos', // TODO remoer, afinal, precisa dos filtros no reports
            'Projeto.administrador_no_orgao',
            'Reports.dashboard_portfolios',
            'Projeto.administrar_portfolios_no_orgao',
            'CadastroGrupoPortfolio.administrador_no_orgao', // verificar se vamos criar um novo perfil para essa tbm
            'CadastroProjetoEtapa.inserir',
            'CadastroProjetoEtapa.editar',
            'CadastroProjetoEtapa.remover',
        ],
    },
    {
        nome: atualizarNomePerfil('Gestor de projetos', ['Órgão Gestor']),
        descricao: 'Pode ser escolhido como responsável no órgão gestor de projetos',
        privilegios: [
            'Reports.executar.Projetos', // TODO remoer, afinal, precisa dos filtros no reports
            'SMAE.gestor_de_projeto',
            'Reports.dashboard_portfolios',
            'CadastroProjetoEtapa.inserir',
            'CadastroProjetoEtapa.editar',
            'CadastroProjetoEtapa.remover',
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
            'CadastroProjetoEtapa.inserir',
            'CadastroProjetoEtapa.editar',
            'CadastroProjetoEtapa.remover',
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

    await criar_emaildb_config();
    await criar_texto_config();
    await atualizar_modulos_e_privilegios();
    await atualizar_perfil_acesso();

    await atualizar_superadmin();
    await ensure_bot_user();
    await ensure_categorica_cronograma();

    await populateEleicao();
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
                            titulo: 'Feito',
                            valor_variavel: 1,
                            ordem: 1,
                        },
                        {
                            titulo: 'Não feito',
                            valor_variavel: 2,
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

        if (!modConfig[1]) return;

        let moduloObject = modulosByCodigo[codModulo];

        if (!moduloObject || moduloObject.descricao !== modConfig[0] || moduloObject.modulo_sistema !== modConfig[1]) {
            moduloObject = await prisma.privilegioModulo.upsert({
                where: { codigo: codModulo },
                update: {
                    descricao: modConfig[0],
                    modulo_sistema: modConfig[1],
                },
                create: {
                    codigo: codModulo,
                    descricao: modConfig[0],
                    modulo_sistema: modConfig[1],
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

    if (!priv || priv.nome !== nome) {
        return prisma.privilegio.upsert({
            where: { codigo: codigo, modulo_id: moduloId },
            update: { nome: nome },
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

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
