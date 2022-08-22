import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient(
    { log: ['query'] }
)


const PrivConfig: any = {

    CadastroCargo: [
        ['CadastroCargo.inserir', 'Inserir cargo'],
        ['CadastroCargo.editar', 'Editar cargo'],
        ['CadastroCargo.remover', 'Remover cargo'],
    ],

    CadastroCoordenadoria: [
        ['CadastroCoordenadoria.inserir', 'Inserir coordenadoria'],
        ['CadastroCoordenadoria.editar', 'Editar coordenadoria'],
        ['CadastroCoordenadoria.remover', 'Remover coordenadoria'],
    ],
    CadastroDepartamento: [
        ['CadastroDepartamento.inserir', 'Inserir departamento'],
        ['CadastroDepartamento.editar', 'Editar departamento'],
        ['CadastroDepartamento.remover', 'Remover departamento'],
    ],
    CadastroDivisaoTecnica: [
        ['CadastroDivisaoTecnica.inserir', 'Inserir divisão técnica'],
        ['CadastroDivisaoTecnica.editar', 'Editar divisão técnica'],
        ['CadastroDivisaoTecnica.remover', 'Remover divisão técnica'],
    ],

    CadastroPessoa: [
        ['CadastroPessoa.inserir', 'Inserir novas pessoas'],
        ['CadastroPessoa.editar', 'Editar dados das pessoas'],
        ['CadastroPessoa.inativar', 'Inativar pessoas'],
        ['CadastroPessoa.editar:apenas-mesmo-orgao', 'Editar pessoas do mesmo orgão'],
        ['CadastroPessoa.inserir:apenas-mesmo-orgao', 'Inserir pessoas do mesmo orgão'],
        ['CadastroPessoa.inativar:apenas_mesmo-orgao', 'Inativar pessoas do mesmo orgão'],
        ['CadastroPessoa.inserir:administrador', 'Inserir outras pessoas com esta permissão'],
    ],
};

const ModuloDescricao: any = {
    CadastroCargo: 'Cadastro de cargos',
    CadastroCoordenadoria: 'Cadastro de coordenadoria',
    CadastroDepartamento: 'Cadastro de departamento',
    CadastroDivisaoTecnica: 'Cadastro de divisão técnica',
    CadastroPessoa: 'Cadastro de pessoas',
};

const PerfilAcessoConfig: any = [
    {
        nome: 'Administrador Geral',
        descricao: 'Administrador Geral',
        privilegios: [
            'CadastroCargo.inserir',
            'CadastroCargo.editar',
            'CadastroCargo.remover',
            'CadastroPessoa.inserir:administrador',
            'CadastroCoordenadoria.inserir',
            'CadastroCoordenadoria.editar',
            'CadastroCoordenadoria.remover',
            'CadastroDepartamento.inserir',
            'CadastroDepartamento.editar',
            'CadastroDepartamento.remover',
            'CadastroDivisaoTecnica.inserir',
            'CadastroDivisaoTecnica.editar',
            'CadastroDivisaoTecnica.remover',
            'CadastroPessoa.inserir',
            'CadastroPessoa.editar',
            'CadastroPessoa.inativar',
        ]
    },
    {
        nome: 'Unidade de Entregas',
        descricao: 'Unidade de Entregas',
        privilegios: [
            'CadastroPessoa.inserir',
            'CadastroPessoa.inativar',
            'CadastroPessoa.editar',
            'CadastroPessoa.editar:apenas-mesmo-orgao',
            'CadastroPessoa.inserir:apenas-mesmo-orgao',
            'CadastroPessoa.inativar:apenas_mesmo-orgao',
        ]
    },

];


async function main() {
    await criar_emaildb_config();
    await atualizar_modulos_e_privilegios();
    await atualizar_perfil_acesso();

    await atualizar_superadmin();
    await atualizar_tipo_orgao();

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

async function atualizar_modulos_e_privilegios() {

    let promises: any[] = [];

    for (const codModulo in PrivConfig) {
        const privilegio = PrivConfig[codModulo];
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

    await Promise.all(promises);

}

async function criar_emaildb_config() {
    await prisma.emaildbConfig.upsert({
        where: { id: 1 },
        update: {},
        create:
        {
            from: '"FooBar" user@example.com',
            template_resolver_class: 'Shypper::TemplateResolvers::HTTP',
            template_resolver_config: { "base_url": "https://example.com/static/template-emails/" },
            email_transporter_class: 'Email::Sender::Transport::SMTP::Persistent',
            email_transporter_config: { "sasl_password": "...", "sasl_username": "apikey", "port": "587", "host": "smtp.sendgrid.net" }
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
        }

        for (const codPriv of perfilAcessoConf.privilegios) {
            const idPriv = (await prisma.privilegio.findFirstOrThrow({ where: { codigo: codPriv } })).id;

            prisma.perfilPrivilegio.findFirst({
                where: {
                    perfil_acesso_id: perfilAcesso.id,
                    privilegios_id: idPriv
                }
            }).then(async (match) => {
                if (!match) {
                    await prisma.perfilPrivilegio.create({
                        data: {
                            perfil_acesso_id: perfilAcesso?.id as number,
                            privilegios_id: idPriv
                        }
                    })
                }
            });
        }
    }

    await Promise.all(promises);
}


async function atualizar_superadmin() {
    const pessoa = await prisma.pessoa.upsert({
        where: { email: 'superadmin@admin.com' },
        update: {},
        create:
        {
            nome_completo: 'super admin',
            nome_exibicao: 'super admin',
            email: 'superadmin@admin.com',
            senha: '$2y$10$LfpFlFCqBnRQpqETLoNYp.lJWvTz7IhUhvzuwptVRfc4D/F0IzRrW' // "test",
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

