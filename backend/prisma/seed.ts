import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const CodModuloContaPerfil = 'conta.perfil';
const CodPermPerfilEditar = 'perfil.editar';

async function main() {
    await criar_emaildb_config();

    await atualizar_modulos();
    await atualizar_permissao();
    await atualizar_superadmin();
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
        where: { codigo: CodModuloContaPerfil },
        update: {},
        create:
        {
            nome: 'Configuração de perfil',
            codigo: CodModuloContaPerfil
        },
    });
}

async function atualizar_permissao() {
    await prisma.permissao.upsert({
        where: { codigo: CodPermPerfilEditar },
        update: {},
        create:
        {
            nome: 'Editar perfil',
            codigo: CodPermPerfilEditar,
            modulo_id: (await prisma.modulo.findFirstOrThrow({ where: { codigo: CodModuloContaPerfil } })).id
        },
    });
}

async function atualizar_superadmin() {
    await prisma.pessoa.upsert({
        where: { email: 'superadmin@admin.com' },
        update: {},
        create:
        {
            nome_completo: 'super admin',
            nome_exibicao: 'super admin',
            email: 'superadmin@admin.com',
            eh_super_admin: true,
            senha: '$2y$10$LfpFlFCqBnRQpqETLoNYp.lJWvTz7IhUhvzuwptVRfc4D/F0IzRrW' // "test",
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