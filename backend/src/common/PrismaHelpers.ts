import { PrismaClient } from 'src/generated/prisma/client';

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

    static async buscaIdsPalavraChave(
        prisma: PrismaClient,
        tableName: string,
        input: string | undefined
    ): Promise<number[] | undefined> {
        let palavrasChave: number[] | undefined = undefined;
        if (input) {
            const trimmedInput = input.trim();
            if (trimmedInput.length === 0) return [];

            const escapeSpecialChars = (text: string) => {
                return text.replace(/[&|!@()\\[\]{}:*?\-\\]/g, '\\$&');
            };

            const words = trimmedInput
                .split(/\s+/i)
                .filter((word) => word.length > 0)
                .map((word) => `${escapeSpecialChars(word)}:*`)
                .join(' & ');

            const rows: { id: number }[] = await prisma.$queryRawUnsafe(
                `SELECT id FROM ${tableName} WHERE vetores_busca @@ to_tsquery('simple', $1)`,
                words
            );
            palavrasChave = rows.map((row) => row.id);
        }
        return palavrasChave;
    }
}
