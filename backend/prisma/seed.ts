import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient(
    { log: ['query'] }
)


const PrivConfig: any = {

    CadastroCargo: false,
    CadastroCoordenadoria: false,
    CadastroDepartamento: false,
    CadastroDivisaoTecnica: false,


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

    CadastroEixo: false,
    CadastroMacroTema: [
        ['CadastroMacroTema.inserir', 'Inserir Macro Tema'],
        ['CadastroMacroTema.editar', 'Editar Macro Tema'],
        ['CadastroMacroTema.remover', 'Remover Macro Tema'],
    ],

    CadastroObjetivoEstrategico: false,
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

    CadastroPdm: [
        ['CadastroPdm.inserir', 'Inserir PDM'],
        ['CadastroPdm.editar', 'Editar PDM'],
        ['CadastroPdm.inativar', 'Inativar PDM'],
        ['CadastroPdm.ativar', 'Ativar PDM'],
    ],
    CadastroRegiao: [
        ['CadastroRegiao.inserir', 'Inserir Regiões'],
        ['CadastroRegiao.editar', 'Editar Regiões'],
        ['CadastroRegiao.remover', 'Remover Regiões'],
    ],
    CadastroMeta: [
        ['CadastroMeta.inserir', 'Inserir Metas'],
        ['CadastroMeta.editar', 'Editar Metas'],
        ['CadastroMeta.remover', 'Remover Metas'],
        ['CadastroMeta.inativar', 'Inativar Metas'],
        ['CadastroMeta.ativar', 'Ativar Metas'],
        ['CadastroMeta.orcamento', 'Atualizar a Execução Orçamentária'],
    ],
    CadastroIndicador: [
        // quem puder editar ou inserir indicador, vai poder gerenciar as variáveis
        ['CadastroIndicador.inserir', 'Inserir Indicadores e variáveis'],
        ['CadastroIndicador.editar', 'Editar Indicadores e variáveis'],
        ['CadastroIndicador.remover', 'Remover Indicadores e variáveis'],
        ['CadastroIndicador.inativar', 'Inativar Indicadores e variáveis'],
        ['CadastroIndicador.ativar', 'Ativar Indicadores e variáveis'],
    ],
    CadastroUnidadeMedida: [
        ['CadastroUnidadeMedida.inserir', 'Inserir Unidade de Medida'],
        ['CadastroUnidadeMedida.editar', 'Editar Unidade de Medida'],
        ['CadastroUnidadeMedida.remover', 'Remover Unidade de Medida'],
    ],
    CadastroIniciativa: [
        ['CadastroIniciativa.inserir', 'Inserir Iniciativas'],
        ['CadastroIniciativa.editar', 'Editar Iniciativas'],
        ['CadastroIniciativa.remover', 'Remover Iniciativas'],
        ['CadastroIniciativa.inativar', 'Inativar Iniciativas'],
        ['CadastroIniciativa.ativar', 'Ativar Iniciativas'],
    ],
    CadastroAtividade: [
        ['CadastroAtividade.inserir', 'Inserir Atividades'],
        ['CadastroAtividade.editar', 'Editar Atividades'],
        ['CadastroAtividade.remover', 'Remover Atividades'],
        ['CadastroAtividade.inativar', 'Inativar Atividades'],
        ['CadastroAtividade.ativar', 'Ativar Atividades'],
    ],
    CadastroCronograma: [
        ['CadastroCronograma.inserir', 'Inserir Cronogramas'],
        ['CadastroCronograma.editar', 'Editar Cronogramas'],
        ['CadastroCronograma.remover', 'Remover Cronogramas'],
        ['CadastroCronograma.inativar', 'Inativar Cronogramas'],
        ['CadastroCronograma.ativar', 'Ativar Cronogramas'],
    ],
    CadastroEtapa: [
        ['CadastroEtapa.inserir', 'Inserir Etapas'],
        ['CadastroEtapa.editar', 'Editar Etapas'],
        ['CadastroEtapa.remover', 'Remover Etapas'],
        ['CadastroEtapa.inativar', 'Inativar Etapas'],
        ['CadastroEtapa.ativar', 'Ativar Etapas'],
    ],
    CadastroCicloFisico: [
        ['CadastroCicloFisico.inserir', 'Inserir Ciclos Físicos'],
        ['CadastroCicloFisico.editar', 'Editar Ciclos Físicos'],
        ['CadastroCicloFisico.remover', 'Remover Ciclos Físicos'],
        ['CadastroCicloFisico.inativar', 'Inativar Ciclos Físicos'],
        ['CadastroCicloFisico.ativar', 'Ativar Ciclos Físicos'],
    ],
    CadastroPainel: [
        ['CadastroPainel.inserir', 'Inserir Painéis'],
        ['CadastroPainel.editar', 'Editar Painéis'],
        ['CadastroPainel.remover', 'Remover Painéis'],
        ['CadastroPainel.inativar', 'Inativar Painéis'],
        ['CadastroPainel.ativar', 'Ativar Painéis'],
    ],
    CadastroGrupoPaineis: [
        ['CadastroGrupoPaineis.inserir', 'Inserir Painéis'],
        ['CadastroGrupoPaineis.editar', 'Editar Painéis'],
        ['CadastroGrupoPaineis.inativar', 'Inativar Painéis'],
        ['CadastroGrupoPaineis.ativar', 'Ativar Painéis'],
    ],
    Config: [
        ['Config.editar', 'Editar configuração de textos do sistema'],
    ],
    Reports: [
        ['Reports.executar', 'Executar relatórios'],
        ['Reports.remover', 'Remover relatórios'],
    ],
    Projeto: [
        ['Projeto.criar', 'Criar novos Projetos'],
        ['Projeto.priorizar', 'Priorizar projetos'],
        ['Projeto.aprovar', 'Aprovar projetos'],
        ['Projeto.arquivar', 'Arquivar projetos'],
        //['SMAE.secretario_executivo', '(Projeto) Secretário Executivo'],
        //['SMAE.secretario_executivo_responsavel', '(Projeto) Secretário Executivo Responsável'],
    ],
    PDM: [
        ['PDM.coordenador_responsavel_cp', '(PDM) Coordenador Responsável CP'],
        ['PDM.tecnico_cp', '(PDM) Técnico CP'],
        ['PDM.admin_cp', '(PDM) Administrador CP'],
        ['PDM.ponto_focal', '(PDM) Ponto Focal'],
    ],

};

const ModuloDescricao: any = {
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
    //SMAE: 'Regras de Negocio do SMAE',
};

let todosPrivilegios: string[] = [];

for (const codModulo in PrivConfig) {
    const privilegio = PrivConfig[codModulo];
    if (privilegio === false) continue;

    for (const priv of privilegio) {
        todosPrivilegios.push(priv[0] as string)
    }
}
console.log(todosPrivilegios)

const PerfilAcessoConfig: any = [
    {
        nome: 'Administrador Geral',
        descricao: 'Administrador Geral',
        privilegios: todosPrivilegios.filter((e) => /^(PDM|SMAE)\./.test(e) === false)
    },
    {
        nome: 'Coordenadoria de Planejamento',
        descricao: 'Coordenadoria de Planejamento',
        privilegios: []
    },
    {
        nome: 'Unidade de Entregas',
        descricao: 'Unidade de Entregas',
        privilegios: [
            'Projeto.criar',
            'Projeto.priorizar',
            'Projeto.aprovar',
            'Projeto.arquivar',
        ]
    },
    {
        nome: 'Responsável por meta na CP',
        descricao: 'Usuários com esta opção podem ser selecionados como Responsável da Coordenadoria na criação/edição de Metas',
        privilegios: [
            'PDM.coordenador_responsavel_cp',
            'PDM.tecnico_cp',
        ]
    },
    {
        nome: 'Administrador CP',
        descricao: 'Pode visualizar e editar dados de todas as metas, em todos os ciclos',
        privilegios: [
            'PDM.admin_cp',
        ]
    },
    {
        nome: 'Técnico CP',
        descricao: 'REMOVER',
        privilegios: [
        ]
    },
    {
        nome: 'Ponto Focal',
        descricao: 'Vê somente as metas onde há dados para registrar evolução no ciclo corrente',
        privilegios: [
            'PDM.ponto_focal',
        ]
    },
    //    {
    //        nome: 'Secretário Executivo',
    //        descricao: 'Pode ser escolhido como secretário executivo nos projetos',
    //        privilegios: [
    //            'SMAE.secretario_executivo',
    //        ]
    //    },
    //    {
    //        nome: 'Secretário Executivo Responsável',
    //        descricao: 'Pode ser escolhido como secretário executivo responsável nos projetos',
    //        privilegios: [
    //            'SMAE.secretario_executivo_responsavel',
    //        ]
    //    },
    //    {
    //        nome: 'Secretário Executivo Responsável',
    //        descricao: 'Pode ser escolhido como secretário executivo responsável nos projetos',
    //        privilegios: [
    //            'SMAE.secretario_executivo_responsavel',
    //        ]
    //    },

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

    let promises: any[] = [];

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
            tos: '...O acesso ao SMAE indica ciencia e concordancia com os termos acima',
        },
    });
}

async function criar_diretiorio() {
    await prisma.diretorio.upsert({
        where: { titulo: 'padrão' },
        update: { padrao: true, ativo: true },
        create:
        {
            padrao: true,
            ativo: true,
            titulo: 'padrão',
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

async function upsert_privilegios(moduloId: number, codigo: string, arg2: string) {

    return prisma.privilegio.upsert({
        where: { codigo: codigo },
        update: { nome: arg2, modulo_id: moduloId },
        create: {
            nome: arg2,
            modulo_id: moduloId,
            codigo: codigo
        }
    });
}


async function atualizar_perfil_acesso() {
    let promises: any[] = [];

    for (const perfilAcessoConf of PerfilAcessoConfig) {
        let perfilAcesso = await prisma.perfilAcesso.findFirst({ where: { nome: perfilAcessoConf.nome }, select: { id: true } });
        if (!perfilAcesso) {
            perfilAcesso = await prisma.perfilAcesso.create({
                data: {
                    nome: perfilAcessoConf.nome,
                    descricao: perfilAcessoConf.descricao,
                }, select: { id: true }
            });
        } else {
            await prisma.perfilAcesso.updateMany({
                where: {
                    id: perfilAcesso.id
                },
                data: {
                    nome: perfilAcessoConf.nome,
                    descricao: perfilAcessoConf.descricao,
                }
            });
        }

        for (const codPriv of perfilAcessoConf.privilegios) {
            console.log(codPriv)
            const idPriv = (await prisma.privilegio.findFirstOrThrow({ where: { codigo: codPriv } })).id;

            prisma.perfilPrivilegio.findFirst({
                where: {
                    perfil_acesso_id: perfilAcesso.id,
                    privilegio_id: idPriv
                }
            }).then(async (match) => {
                if (!match) {
                    await prisma.perfilPrivilegio.create({
                        data: {
                            perfil_acesso_id: perfilAcesso?.id as number,
                            privilegio_id: idPriv
                        }
                    })
                }
            });
        }
    }

    await Promise.all(promises);
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

