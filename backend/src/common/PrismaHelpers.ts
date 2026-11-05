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

    static async buscaIdsPalavraChave(
        prisma: PrismaClient,
        tableName: string,
        input: string | undefined,
        // separadores usados para quebrar a busca em termos. Por padrão só espaços.
        // Para tabelas cujo vetor de busca também indexa o código quebrado em partes
        // (ex.: variavel usa REPLACE de '.' e '/' por espaço), passe /[\s./]+/ para que
        // uma busca por trecho do meio do código (ex.: "06.00719/2024") case com as partes.
        splitRegex: RegExp = /\s+/,
        // Quando o vetor da tabela também indexa f_tsvector_numeros_flexiveis e
        // f_tsvector_trechos_palavras (ver 0054), a busca acha trechos:
        // - palavras só com dígitos e . / - viram (junto:* | (parte1:* & parte2:* ...)),
        //   sem zeros à esquerda: "067" acha "2026.067.89922" e "34994" acha "034994/2026".
        //   Com 3+ dígitos também acha trecho do meio ou do fim: "499" acha "034994/2026".
        // - palavras só com letras, com 3+ letras, também acham trecho do meio ou do fim:
        //   "masp" acha "emasp".
        buscaPorTrecho = false
    ): Promise<number[] | undefined> {
        let palavrasChave: number[] | undefined = undefined;
        if (input) {
            const trimmedInput = input.trim();
            if (trimmedInput.length === 0) return [];

            const escapeSpecialChars = (text: string) => {
                return text.replace(/[&|!@()\\[\]{}:*?\-\\]/g, '\\$&');
            };

            const words = trimmedInput
                .split(splitRegex)
                .filter((word) => word.length > 0)
                .map((word) => {
                    if (buscaPorTrecho && /^[\d./-]+$/.test(word) && /\d/.test(word)) {
                        return PrismaHelpers.tsqueryNumeroFlexivel(word);
                    }
                    if (buscaPorTrecho && /^\p{L}+$/u.test(word) && word.length >= PrismaHelpers.MIN_TRECHO) {
                        // só letras: não precisa de escape. "qx" + trecho casa com os finais
                        // de palavras indexados por f_tsvector_trechos_palavras.
                        return `(${word}:* | qx${word}:*)`;
                    }
                    return `${escapeSpecialChars(word)}:*`;
                })
                .join(' & ');

            const rows: { id: number }[] = await prisma.$queryRawUnsafe(
                `SELECT id FROM ${tableName} WHERE vetores_busca @@ to_tsquery('simple_unaccent', $1)`,
                words
            );
            palavrasChave = rows.map((row) => row.id);
        }
        return palavrasChave;
    }

    // Mínimo de dígitos/letras para buscar também por trecho (meio ou fim): abaixo disso,
    // "26" casaria com todo número que tem 26 (todo 2026, por exemplo).
    // Tem que bater com o "length - 2" de f_tsvector_numeros_flexiveis e
    // f_tsvector_trechos_palavras (ver 0054).
    private static readonly MIN_TRECHO = 3;

    private static tsqueryNumeroFlexivel(word: string): string {
        const semZeros = (n: string) => n.replace(/^0+(?=\d)/, '');
        const partes = word
            .split(/[./-]+/)
            .filter((p) => p.length > 0)
            .map(semZeros);

        const alternativas: string[] = [];
        if (partes.length === 1) {
            alternativas.push(partes[0] + ':*');
        } else {
            const todasAsPartes = partes.map((p) => p + ':*').join(' & ');
            alternativas.push(semZeros(partes.join('')) + ':*', `(${todasAsPartes})`);
        }

        // Busca por trecho: o vetor indexa todos os finais de cada número com o prefixo "qx"
        // (ver 0054), e um trecho qualquer é o começo de algum final. Usa os dígitos como
        // digitados, com zeros e sem pontuação.
        const digitos = word.replace(/\D/g, '');
        if (digitos.length >= PrismaHelpers.MIN_TRECHO) {
            alternativas.push('qx' + digitos + ':*');
        }

        return alternativas.length === 1 ? alternativas[0] : `(${alternativas.join(' | ')})`;
    }
}
