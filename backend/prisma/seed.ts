import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const CodModuloContaPerfil = 'conta.perfil';
const CodPermPerfilEditar = 'perfil.editar';

async function main() {
    await atualizar_modulos();
    await atualizar_permissao();
    await atualizar_superadmin();
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
            token_acesso_api: '834987cc-d4e0-4d6f-b004-c6c3cf4c3998',
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