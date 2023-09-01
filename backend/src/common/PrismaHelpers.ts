import { PrismaClient } from '@prisma/client';

export class PrismaHelpers {
    static async prismaCodigo2IdMap(
        prisma: PrismaClient,
        model: keyof PrismaClient,
        ids: number[],
        isCodigoNullable: boolean,
        filterColumn: string,
        extraValue: any | undefined
    ): Promise<Record<string, number>> {
        if (ids.length === 0) return {};

        const whereCondition: any = { id: { in: ids } };
        if (isCodigoNullable) {
            whereCondition.codigo = { not: null };
        }
        whereCondition.removido_em = null;
        if (extraValue !== undefined) {
            whereCondition[filterColumn] = extraValue;
        }

        const rows = await (prisma[model] as any).findMany({
            where: whereCondition,
            select: { id: true, codigo: true },
        });

        return rows.reduce((p: any, c: any) => {
            if (!c.codigo) return p;
            return { ...p, [c.codigo.toLowerCase()]: c.id };
        }, {});
    }
}
