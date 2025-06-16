import { PrismaService } from 'src/prisma/prisma.service';
import { EntidadesSyncMap } from './sync-entities.type';

export const createEntidadesSync = (prisma: PrismaService): EntidadesSyncMap => ({
    orgao: {
        prismaDelegate: prisma.orgao,
        select: {
            id: true,
            sigla: true,
            descricao: true,
        },
        versao: '2024.0.1',
    },
    unidadeMedida: {
        prismaDelegate: prisma.unidadeMedida,
        select: {
            id: true,
            sigla: true,
            descricao: true,
        },
        versao: '2024.0.1',
    },
    assuntoVariavel: {
        prismaDelegate: prisma.assuntoVariavel,
        select: {
            id: true,
            nome: true,
        },
        versao: '2024.0.1',
    },
    regiao: {
        prismaDelegate: prisma.regiao,
        select: {
            id: true,
            descricao: true,
        },
        versao: '2024.0.1',
    },
    fonteVariavel: {
        prismaDelegate: prisma.fonteVariavel,
        select: {
            id: true,
            nome: true,
        },
        versao: '2024.0.1',
    },
    variavelCategorica: {
        prismaDelegate: prisma.variavelCategorica,
        select: {
            id: true,
            titulo: true,
            descricao: true,
        },
        versao: '2024.0.1',
    },
    tema: {
        prismaDelegate: prisma.tema,
        select: {
            id: true,
            descricao: true,
        },
        versao: '2024.0.1',
    },
    ods: {
        prismaDelegate: prisma.ods,
        select: {
            id: true,
            descricao: true,
        },
        versao: '2024.0.1',
    },
    tag: {
        prismaDelegate: prisma.tag,
        select: {
            id: true,
            descricao: true,
        },
        versao: '2024.0.1',
    },
    tipoAditivo: {
        prismaDelegate: prisma.tipoAditivo,
        select: {
            id: true,
            nome: true,
        },
        versao: '2024.0.1',
    },
    projetoTag: {
        prismaDelegate: prisma.projetoTag,
        select: {
            id: true,
            descricao: true,
        },
        versao: '2024.0.1',
    },
    tipoIntervencao: {
        prismaDelegate: prisma.tipoIntervencao,
        select: {
            id: true,
            nome: true,
        },
        versao: '2024.0.1',
    },
});
