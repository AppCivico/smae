import { Prisma } from 'src/generated/prisma/client';

export type BaseSelect = { id: true } & Record<string, boolean>;

// Representa o delegate do Prisma, que possui `findMany`
export type PrismaModelDelegate = {
    findMany: (args?: any) => Promise<any[]>;
};

// Configuração de uma única entidade
export type EntidadeSyncConfig<
    Delegate extends PrismaModelDelegate,
    Select extends BaseSelect & Record<string, boolean>,
> = {
    prismaDelegate: Delegate;
    select: Select;
    versao: string;
};

export type EntidadesSyncMap = {
    orgao: EntidadeSyncConfig<Prisma.OrgaoDelegate<any>, Prisma.OrgaoSelect & BaseSelect>;
    unidadeMedida: EntidadeSyncConfig<Prisma.UnidadeMedidaDelegate<any>, Prisma.UnidadeMedidaSelect & BaseSelect>;
    assuntoVariavel: EntidadeSyncConfig<Prisma.AssuntoVariavelDelegate<any>, Prisma.AssuntoVariavelSelect & BaseSelect>;
    regiao: EntidadeSyncConfig<Prisma.RegiaoDelegate<any>, Prisma.RegiaoSelect & BaseSelect>;
    fonteVariavel: EntidadeSyncConfig<Prisma.FonteVariavelDelegate<any>, Prisma.FonteVariavelSelect & BaseSelect>;
    variavelCategorica: EntidadeSyncConfig<
        Prisma.VariavelCategoricaDelegate<any>,
        Prisma.VariavelCategoricaSelect & BaseSelect
    >;
    tema: EntidadeSyncConfig<Prisma.TemaDelegate<any>, Prisma.TemaSelect & BaseSelect>;
    ods: EntidadeSyncConfig<Prisma.OdsDelegate<any>, Prisma.OdsSelect & BaseSelect>;
    tag: EntidadeSyncConfig<Prisma.TagDelegate<any>, Prisma.TagSelect & BaseSelect>;
    tipoAditivo: EntidadeSyncConfig<Prisma.TipoAditivoDelegate<any>, Prisma.TipoAditivoSelect & BaseSelect>;
    projetoTag: EntidadeSyncConfig<Prisma.ProjetoTagDelegate<any>, Prisma.ProjetoTagSelect & BaseSelect>;
    tipoIntervencao: EntidadeSyncConfig<Prisma.TipoIntervencaoDelegate<any>, Prisma.TipoIntervencaoSelect & BaseSelect>;
};
