import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    await atualizar_modulos();
    await atualizar_permissao();
}

async function atualizar_modulos() {
    await prisma.modulo.upsert({
        where: { codigo: 'conta.perfil' },
        update: {},
        create:
        {
            nome: 'Configuração de perfil',
            codigo: 'conta.perfil'
        },
    });
}

async function atualizar_permissao() {
    await prisma.permissao.upsert({
        where: { codigo: 'perfil.editar' },
        update: {},
        create:
        {
            nome: 'Editar perfil',
            codigo: 'editar.perfil',
            modulo_id: (await prisma.modulo.findFirstOrThrow({ where: { codigo: 'conta.perfil' } })).id
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