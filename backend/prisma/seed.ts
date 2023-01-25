import { PrismaClient } from '@prisma/client'
import { ListaDePrivilegios } from '../src/common/ListaDePrivilegios';
const prisma = new PrismaClient(
    { log: ['query'] }
)


const ModuloDescricao: Record<string, string> = {
    CadastroOrgao: 'Cadastro de Órgão',
    CadastroTipoOrgao: 'Cadastro de Tipo de Órgão',
    CadastroPessoa: 'Cadastro de pessoas',
    CadastroOds: 'Cadastro de ODS',
    CadastroPdm: 'Cadastro do PDM',
    CadastroFonteRecurso: 'Cadastro de Fonte de Recurso',
    CadastroTipoDocumento: 'Cadastro de Tipo de Arquivo',
    CadastroTag: 'Cadastro de Tag',
    CadastroMacroTema: 'Cadastro de Macro Tema',
    CadastroSubTema: 'Cadastro de Sub Tema',
    CadastroTema: 'Cadastro de Tema',
    CadastroRegiao: 'Cadastro de Regiões',
    CadastroMeta: 'Cadastro de Metas',
    CadastroIndicador: 'Cadastro de Indicadores',
    CadastroUnidadeMedida: 'Cadastro de Unidade de Medidas',
    CadastroIniciativa: 'Cadastro de Iniciativas',
    CadastroAtividade: 'Cadastro de Atividades',
    CadastroCronograma: 'Cadastro de Cronogramas',
    CadastroEtapa: 'Cadastro de Etapas',
    CadastroCicloFisico: 'Cadastro de Ciclos Físicos',
    CadastroPainel: 'Cadastro de Painéis',
    CadastroGrupoPaineis: 'Cadastro de Grupos de Painéis',
    Config: 'Configurações do Sistema',
    Reports: 'Relatórios',
    Projeto: 'Cadastro de Projetos',
    PDM: 'Regras de Negocio do PDM',
    SMAE: 'Regras de Negocio do SMAE',
};
type ListaDeModulos = keyof typeof ModuloDescricao;

const PrivConfig: Record<ListaDeModulos, false | [ListaDePrivilegios, string][]> = {

    CadastroCargo: false,
    CadastroCoordenadoria: false,
    CadastroDepartamento: false,
    CadastroDivisaoTecnica: false,
    CadastroCicloFisico: false,
    CadastroEixo: false,
    CadastroObjetivoEstrategico: false,
    CadastroEtapa: false,

    CadastroFonteRecurso: [
        ['CadastroFonteRecurso.inserir', 'Inserir Fonte de Recurso'],
        ['CadastroFonteRecurso.editar', 'Editar Fonte de Recurso'],
        ['CadastroFonteRecurso.remover', 'Remover Fonte de Recurso'],
    ],

    CadastroOds: [
        ['CadastroOds.inserir', 'Inserir ODS'],
        ['CadastroOds.editar', 'Editar ODS'],
        ['CadastroOds.remover', 'Remover ODS'],
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
        ['CadastroPessoa.inserir', 'Inserir novas pessoas com o mesmo órgão'],
        ['CadastroPessoa.editar', 'Editar dados das pessoas com o mesmo órgão'],
        ['CadastroPessoa.inativar', 'Inativar pessoas com o mesmo órgão'],
        ['CadastroPessoa.ativar', 'Ativar pessoas com o mesmo órgão'],
        ['CadastroPessoa.administrador', 'Editar/Inserir/Inativar/Ativar qualquer pessoa, até mesmo outros administradores'],
    ],
    CadastroUnidadeMedida: [
        ['CadastroUnidadeMedida.inserir', 'Inserir Unidade de Medida'],
        ['CadastroUnidadeMedida.editar', 'Editar Unidade de Medida'],
        ['CadastroUnidadeMedida.remover', 'Remover Unidade de Medida'],
    ],


    CadastroRegiao: [
        ['CadastroRegiao.inserir', 'Inserir Regiões'],
        ['CadastroRegiao.editar', 'Editar Regiões'],
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
        ['CadastroTema.inserir', 'Inserir Macro Tema'],
        ['CadastroTema.editar', 'Editar Macro Tema'],
        ['CadastroTema.remover', 'Remover Macro Tema'],
    ],
    CadastroSubTema: [
        ['CadastroSubTema.inserir', 'Inserir Macro Tema'],
        ['CadastroSubTema.editar', 'Editar Macro Tema'],
        ['CadastroSubTema.remover', 'Remover Macro Tema'],
    ],
    CadastroTag: [
        ['CadastroTag.inserir', 'Inserir Tag'],
        ['CadastroTag.editar', 'Editar Tag'],
        ['CadastroTag.remover', 'Remover Tag'],
    ],
    CadastroMeta: [
        // de fato, esse é o administrador, mas o frontend já usava o código CadastroMeta.inserir
        // quando tem essa permissão, é liberado vários outros itens
        ['CadastroMeta.inserir', 'Administrar Metas, Iniciativas, Atividades, Cronogramas/Etapas e Painéis.'],
        ['CadastroMeta.editar', 'Editar Metas que for responsável'],
        ['CadastroMeta.remover', 'Remover Metas que for responsável'],
        ['CadastroMeta.orcamento', 'Atualizar a Execução Orçamentária que for responsável'],
    ],
    CadastroIndicador: [
        // quem puder editar ou inserir indicador, vai poder gerenciar as variáveis
        ['CadastroIndicador.inserir', 'Inserir Indicadores e variáveis onde for responsável'],
        ['CadastroIndicador.editar', 'Editar Indicadores e variáveis onde for responsável'],
        ['CadastroIndicador.remover', 'Remover Indicadores e variáveis onde for responsável'],
    ],
    CadastroIniciativa: [
        ['CadastroIniciativa.inserir', 'Inserir Iniciativas que for responsável'],
        ['CadastroIniciativa.editar', 'Editar Iniciativas que for responsável'],
        ['CadastroIniciativa.remover', 'Remover Iniciativas que for responsável'],
    ],
    CadastroAtividade: [
        ['CadastroAtividade.inserir', 'Inserir Atividades que for responsável'],
        ['CadastroAtividade.editar', 'Editar Atividades que for responsável'],
        ['CadastroAtividade.remover', 'Remover Atividades que for responsável'],
    ],
    CadastroCronograma: [
        ['CadastroCronograma.inserir', 'Inserir Cronogramas que for responsável'],
        ['CadastroCronograma.editar', 'Editar Cronogramas que for responsável'],
        ['CadastroCronograma.remover', 'Remover Cronogramas que for responsável'],
    ],
    CadastroPainel: [
        ['CadastroPainel.visualizar', 'Visualizar Painéis e detalhes do conteúdo'],
        ['CadastroPainel.inserir', 'Inserir Painéis que for responsável'],
        ['CadastroPainel.editar', 'Editar Painéis que for responsável'],
        ['CadastroPainel.remover', 'Remover Painéis que for responsável'],
    ],
    CadastroGrupoPaineis: [
        ['CadastroGrupoPaineis.inserir', 'Inserir Grupo de Painéis'],
        ['CadastroGrupoPaineis.editar', 'Editar Grupo de Painéis'],
        ['CadastroGrupoPaineis.remover', 'Remover Grupo de Painéis'],
    ],

    Reports: [
        ['Reports.executar', 'Executar relatórios'],
        ['Reports.remover', 'Remover relatórios'],
    ],

    Config: [
        ['Config.editar', 'Editar configuração de textos do sistema'],
    ],
    Projeto: [
        ['Projeto.administrador', '(Projeto) Administrar Portfolio e todos os projetos'],
        ['SMAE.gestor_de_projeto', '(Projeto) Gestor de Projeto'],
        ['SMAE.colaborador_de_projeto', '(Projeto) Colaborador de projeto'],
    ],
    PDM: [
        ['PDM.coordenador_responsavel_cp', 'Pode ser escolhido como Coordenador Responsável na CP'],
        ['PDM.tecnico_cp', '(Monitoramento) Técnico CP'],
        ['PDM.admin_cp', '(Monitoramento) Administrador CP'],
        ['PDM.ponto_focal', '(Monitoramento) Ponto Focal'],
    ],

};

let todosPrivilegios: ListaDePrivilegios[] = [];

for (const codModulo in PrivConfig) {
    const privilegio = PrivConfig[codModulo];
    if (privilegio === false) continue;

    for (const priv of privilegio) {
        todosPrivilegios.push(priv[0])
    }
}
console.log(todosPrivilegios)


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

const PerfilAcessoConfig: {
    nome: string;
    descricao: string;
    privilegios: ListaDePrivilegios[] | false
}[] = [
        {
            nome: 'Técnico CP',
            descricao: '',
            privilegios: false
        },
        {
            nome: 'Unidade de Entregas',
            descricao: '',
            privilegios: false
        },
        {
            nome: 'Administrador Geral',
            descricao: 'Administrador Geral - Todas as permissões do sistema, exceto regras de negocio',
            privilegios: todosPrivilegios.filter((e) => /^(PDM|SMAE)\./.test(e) === false)
        },
        {
            nome: 'Administrador CP',
            descricao: 'No monitoramento, pode visualizar e editar dados de todas as metas, em todos os ciclos. Gerenciar parcialmente as metas e PDM.',
            privilegios: [
                'PDM.admin_cp',
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

                'Reports.executar',
                'Reports.remover',
            ]
        },
        {
            nome: 'Coordenadoria de Planejamento',
            descricao: 'Pode criar pessoas no mesmo órgão',
            privilegios: [
                'CadastroPessoa.inserir',
                'CadastroPessoa.editar',
                'CadastroPessoa.inativar',
                'CadastroPessoa.ativar'
            ]
        },
        {
            nome: 'Ponto Focal',
            descricao: 'Vê somente as metas onde há dados para registrar evolução no ciclo corrente',
            privilegios: [
                'PDM.ponto_focal',
                'CadastroMeta.listar',
                'CadastroPainel.visualizar',
            ]
        },
        {
            nome: 'Responsável por meta na CP',
            descricao: 'Usuários com esta opção podem ser selecionados como Responsável da Coordenadoria na criação/edição de Metas',
            privilegios: PrivRespNaCp
        },
        {
            nome: 'Responsável por meta na CP - orçamento',
            descricao: 'Usuários com esta opção podem ser selecionados como Responsável da Coordenadoria na criação/edição de Metas',
            privilegios: [
                ...PrivRespNaCp,
                'CadastroMeta.orcamento'
            ]
        },
        {
            nome: 'Administrador de Portfolio',
            descricao: 'Gerenciar os Portfolios',
            privilegios: [
                'Projeto.administrador',
            ]
        },
        {
            nome: 'Órgão Gestor',
            descricao: 'Pode ser escolhido para administrar os projetos, enquanto participar do órgão gestor',
            privilegios: [
                'SMAE.gestor_de_projeto',
            ]
        },
        {
            nome: 'Colaborador de Projetos',
            descricao: 'Pode ser escolhido como responsável em projetos e contribuir durante a fase de planejamento',
            privilegios: [
                'SMAE.colaborador_de_projeto',
            ]
        },

    ];

console.log(PerfilAcessoConfig);

async function main() {
    await criar_emaildb_config();
    await criar_texto_config();
    await atualizar_modulos_e_privilegios();
    await atualizar_perfil_acesso();

    await atualizar_superadmin();
    //await atualizar_ods();
    //await atualizar_tipo_orgao();
    //await atualizar_orgao();

}

/*

async function atualizar_orgao() {
    let list = [{ sigla: 'SEPEP', desc: 'Secretaria Executiva de Planejamento e Entregas Prioritárias', tipo: 'Secretaria' }];

    for (const item of list) {
        const tipo = await prisma.tipoOrgao.findFirstOrThrow({
            where: { descricao: item.tipo },
        });

        await prisma.orgao.upsert({
            where: { descricao: item.desc },
            update: {
                sigla: item.sigla,
                tipo_orgao_id: tipo.id,
            },
            create: {
                sigla: item.sigla,
                descricao: item.desc,
                tipo_orgao_id: tipo.id,
            },
        });
    }
}

async function atualizar_ods() {
    let list = [{ numero: 1, titulo: 'Erradicação da Pobreza' }];

    for (const desc of list) {
        await prisma.ods.upsert({
            where: { numero: desc.numero },
            update: { titulo: desc.titulo },
            create: {
                numero: desc.numero as number,
                titulo: desc.titulo,
                descricao: ''
            },
        });
    }
}

async function atualizar_tipo_orgao() {
    let list = ['Secretaria', 'Subprefeitura', 'Autarquia', 'Empresa Pública'];

    for (const desc of list) {
        let found = await prisma.tipoOrgao.findFirst({ where: { descricao: desc }, select: { id: true } });
        if (!found) {
            found = await prisma.tipoOrgao.create({
                data: {
                    descricao: desc
                }, select: { id: true }
            });
        }
    }
}
*/

async function atualizar_modulos_e_privilegios() {

    const promises: Array<PromiseLike<any>> = [];

    for (const codModulo in PrivConfig) {
        const privilegio = PrivConfig[codModulo];

        if (privilegio === false) {

            await prisma.perfilPrivilegio.deleteMany({
                where: {
                    privilegio: {
                        modulo: {
                            codigo: codModulo
                        }
                    }
                }
            });

            await prisma.privilegio.deleteMany({
                where: {
                    modulo: {
                        codigo: codModulo
                    }
                }
            });

            await prisma.modulo.deleteMany({
                where: {
                    codigo: codModulo
                }
            });

        } else {

            const moduloObject = await prisma.modulo.upsert({
                where: { codigo: codModulo },
                update: {
                    descricao: ModuloDescricao[codModulo as string] as string,
                },
                create:
                {
                    codigo: codModulo,
                    descricao: ModuloDescricao[codModulo as string] as string,
                },
            });
            for (const priv of privilegio) {
                promises.push(upsert_privilegios(moduloObject.id, priv[0] as string, priv[1] as string))
            }
        }

    }

    await Promise.all(promises);

    await prisma.perfilPrivilegio.deleteMany({
        where: {
            privilegio: {
                codigo: {
                    notIn: todosPrivilegios
                }
            }
        }
    });

    await prisma.privilegio.deleteMany({
        where: {
            codigo: {
                notIn: todosPrivilegios
            }
        }
    });

}

async function criar_texto_config() {
    await prisma.textoConfig.upsert({
        where: { id: 1 },
        update: {},
        create:
        {
            bemvindo_email: 'Ao acessar o SMAE, Você está ciente e autoriza...',
            tos: '...O acesso ao SMAE indica ciência e concordância com os termos acima',
        },
    });
}


async function criar_emaildb_config() {
    await prisma.emaildbConfig.upsert({
        where: { id: 1 },
        update: {},
        create:
        {
            from: 'Sistema" <sistema@exemplo.com>',
            template_resolver_class: 'Shypper::TemplateResolvers::HTTP',
            template_resolver_config: { "base_url": "http://smae_api:3001/public/email-templates/" },
            email_transporter_class: 'Email::Sender::Transport::SMTP::Persistent',
            email_transporter_config: { "sasl_password": "...", "sasl_username": "apikey", "port": "25", "host": "smtp_web" }
        },
    });
}

async function upsert_privilegios(moduloId: number, codigo: string, nome: string) {

    return prisma.privilegio.upsert({
        where: { codigo: codigo },
        update: { nome: nome, modulo_id: moduloId },
        create: {
            nome: nome,
            modulo_id: moduloId,
            codigo: codigo
        }
    });
}


async function atualizar_perfil_acesso() {

    for (const perfilAcessoConf of PerfilAcessoConfig) {

        if (perfilAcessoConf.privilegios === false) {

            // apagar quem tiver acesso ao perfilAcesso e remover o próprio perfil
            const perfilAcesso = await prisma.perfilAcesso.findFirst({ where: { nome: perfilAcessoConf.nome }, select: { id: true } });
            if (!perfilAcesso) continue;

            await prisma.pessoaPerfil.deleteMany({
                where: {
                    perfil_acesso_id: perfilAcesso.id
                }
            });

            await prisma.perfilPrivilegio.deleteMany({
                where: {
                    perfil_acesso_id: perfilAcesso.id
                }
            });

            await prisma.perfilAcesso.delete({
                where: {
                    id: perfilAcesso.id
                }
            });

        } else {

            let perfilAcesso = await prisma.perfilAcesso.findFirst({ where: { nome: perfilAcessoConf.nome }, select: { id: true } });
            if (!perfilAcesso) {
                perfilAcesso = await prisma.perfilAcesso.create({
                    data: {
                        nome: perfilAcessoConf.nome,
                        descricao: perfilAcessoConf.descricao,
                    }, select: { id: true }
                });
            } else {
                await prisma.perfilAcesso.update({
                    where: { id: perfilAcesso.id },
                    data: {
                        nome: perfilAcessoConf.nome,
                        descricao: perfilAcessoConf.descricao,
                    }
                });
            }

            await prisma.perfilPrivilegio.deleteMany({
                where: {
                    perfil_acesso_id: perfilAcesso.id,
                    privilegio: {
                        codigo: { notIn: perfilAcessoConf.privilegios }
                    }
                }
            });

            for (const codPriv of perfilAcessoConf.privilegios) {
                const priv = await prisma.privilegio.findFirst({ where: { codigo: codPriv } });
                if (!priv) {
                    throw `Não encontrado priv ${codPriv}`;
                }
                const idPriv = priv.id;

                const match = await prisma.perfilPrivilegio.findFirst({
                    where: {
                        perfil_acesso_id: perfilAcesso.id,
                        privilegio_id: idPriv
                    }
                });
                if (!match) {
                    await prisma.perfilPrivilegio.create({
                        data: {
                            perfil_acesso_id: perfilAcesso?.id as number,
                            privilegio_id: idPriv
                        }
                    })
                }
            }
        }

    }
}


async function atualizar_superadmin() {
    await prisma.tipoOrgao.upsert({
        where: { id: 1 },
        update: {},
        create:
        {
            id: 1,
            descricao: 'registro 1 do tipo orgao'
        },
    });

    await prisma.orgao.upsert({
        where: { id: 1 },
        update: {},
        create:
        {
            id: 1,
            descricao: 'registro 1 do orgao',
            sigla: 'ID1',
            tipo_orgao_id: 1,
        },
    });


    const pessoa = await prisma.pessoa.upsert({
        where: { email: 'superadmin@admin.com' },
        update: {},
        create:
        {
            pessoa_fisica: {
                create: {
                    cargo: '',
                    cpf: '',
                    lotacao: '',
                    orgao_id: 1
                }
            },
            senha_bloqueada: false,
            qtde_senha_invalida: 0,
            nome_completo: 'super admin',
            nome_exibicao: 'super admin',
            email: 'superadmin@admin.com',
            senha: '$2b$10$2DUUZc55NxezhEydgfUSTexk4.1qjbvb.873cZhCpIvjw4izkFqcW' // "!286!QDM7H",
        },
    });

    const idPerfilAcesso = (await prisma.perfilAcesso.findFirstOrThrow({ where: { nome: 'Administrador Geral' } })).id;

    let pessoaPerfilAdmin = await prisma.pessoaPerfil.findFirst({
        where: {
            pessoa_id: pessoa.id,
            perfil_acesso_id: idPerfilAcesso,
        }
    });
    if (!pessoaPerfilAdmin) {
        pessoaPerfilAdmin = await prisma.pessoaPerfil.create({
            data: {
                pessoa_id: pessoa.id,
                perfil_acesso_id: idPerfilAcesso
            }
        });
    }

}



main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

