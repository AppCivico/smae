import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient(
    //{log: ['query']}
)

const CodModuloAdmin = 'admin';
const CodPermGerenciarPessoa = 'gerenciar.pessoa';
const CodPermGerenciarOrgao = 'gerenciar.orgao';
const CodPermGerenciarDivisaoTecnica = 'gerenciar.divisao_tecnica';
const CodPermGerenciarCargo = 'gerenciar.cargo';
const CodPermGerenciarCoordenadoria = 'gerenciar.coordenadoria';
const DescricaoFuncaoAdmin = 'Administrador';

async function atualizar_permissao() {
    await upsert_permissao('Criar/Editar/Inativar qualquer pessoa', CodPermGerenciarPessoa, CodModuloAdmin);
    await upsert_permissao('Criar/Editar/Inativar qualquer órgão', CodPermGerenciarOrgao, CodModuloAdmin);
    await upsert_permissao('Criar/Editar/Inativar qualquer divisão técnica', CodPermGerenciarDivisaoTecnica, CodModuloAdmin);
    await upsert_permissao('Criar/Editar/Inativar qualquer cargo', CodPermGerenciarCargo, CodModuloAdmin);
    await upsert_permissao('Criar/Editar/Inativar qualquer coordenadoria', CodPermGerenciarCoordenadoria, CodModuloAdmin);
}

async function main() {
    await criar_emaildb_config();
    await atualizar_funcao();

    await atualizar_modulos();
    await atualizar_permissao();
    await atualizar_superadmin();
}

async function atualizar_funcao() {

    let funcaoAdmin = await prisma.funcao.findFirst({ where: { descricao: DescricaoFuncaoAdmin } });
    console.log('funcaoAdmin', funcaoAdmin)
    if (!funcaoAdmin) {
        funcaoAdmin = await prisma.funcao.create({ data: { descricao: DescricaoFuncaoAdmin } });
    }

    await Promise.all([
        upsert_funcao_permissao(funcaoAdmin.id, CodPermGerenciarPessoa),
        upsert_funcao_permissao(funcaoAdmin.id, CodPermGerenciarCargo),
        upsert_funcao_permissao(funcaoAdmin.id, CodPermGerenciarOrgao),
        upsert_funcao_permissao(funcaoAdmin.id, CodPermGerenciarDivisaoTecnica),
        upsert_funcao_permissao(funcaoAdmin.id, CodPermGerenciarCoordenadoria),
    ]);

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

async function atualizar_modulos() {
    await prisma.modulo.upsert({
        where: { codigo: CodModuloAdmin },
        update: {},
        create:
        {
            nome: 'Administração',
            codigo: CodModuloAdmin
        },
    });
}


async function atualizar_superadmin() {
    let pessoa = await prisma.pessoa.upsert({
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

    let time = await prisma.time.upsert({
        where: {
            nome: 'TI/Admin'
        },
        update: {},
        create: {
            nome: 'TI/Admin',
            descricao: 'Time interno para administração'
        }
    });

    let timePessoa = await prisma.timePessoa.findFirst({ where: { pessoa_id: pessoa.id, time_id: time.id } });
    if (!timePessoa) {
        timePessoa = await prisma.timePessoa.create({
            data: {
                pessoa_id: pessoa.id,
                time_id: time.id,
            }
        });
    }

    let funcaoAdmin = await prisma.funcao.findFirstOrThrow({ where: { descricao: DescricaoFuncaoAdmin } });

    await prisma.timePessoaFuncao.deleteMany({
        where: { time_pessoa_id: timePessoa.id }
    });
    await prisma.timePessoaFuncao.create({
        data: { time_pessoa_id: timePessoa.id, funcao_id: funcaoAdmin.id }
    });

}


async function upsert_funcao_permissao(funcaoId: number, codPerm: string) {
    console.log('-> upsert_funcao_permissao', 'funcao-id', funcaoId, 'codPerm', codPerm)

    let permId = (await prisma.permissao.findFirstOrThrow({ where: { codigo: codPerm } })).id;
    let funcaoPerm = await prisma.funcaoPermissao.findFirst({
        where: {
            funcao_id: funcaoId,
            permissao_id: permId
        }
    });

    if (!funcaoPerm) {
        await prisma.funcaoPermissao.create({
            data: {
                funcao_id: funcaoId,
                permissao_id: permId
            }
        });
    }
}

async function upsert_permissao(nome: string, codPerm: string, codMod: string) {
    console.log('-> upsert_funcao_permissao', 'codPerm', codPerm, 'codMod', codMod, '--', nome)
    await prisma.permissao.upsert({
        where: { codigo: codPerm },
        update: {},
        create:
        {
            nome: nome,
            codigo: codPerm,
            modulo_id: (await prisma.modulo.findFirstOrThrow({ where: { codigo: codMod } })).id
        },
    });
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