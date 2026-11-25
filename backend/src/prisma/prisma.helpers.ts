/**
 * Combina dois where do Prisma para que os dois valham (AND lógico). `AND`/`NOT` são concatenados; qualquer outra
 * chave presente nos dois (`OR`, filtro de relação, coluna) vai para o `AND` em vez de ser sobrescrita.
 *
 * Exemplo:
 *   PrismaMerge(
 *     { AND: [{ a: 1 }], OR: [{ b: 2 }], NOT: { c: 3 }, d: 4 },
 *     { AND: [{ x: 9 }], OR: [{ y: 8 }], NOT: { z: 7 }, d: 5, e: 6 }
 *   )
 *   // => {
 *   //   AND: [{ a: 1 }, { x: 9 }, { OR: [{ y: 8 }] }, { d: 5 }],
 *   //   OR: [{ b: 2 }],
 *   //   NOT: [{ c: 3 }, { z: 7 }],
 *   //   d: 4,
 *   //   e: 6
 *   // }
 */
export function PrismaMerge<T extends object>(base: T, extension: T): T {
    const result = { ...base } as Record<string, unknown>;
    const conflicts: Record<string, unknown>[] = [];

    for (const [key, value] of Object.entries(extension)) {
        if (value === undefined) continue;
        const current = result[key];
        if (current === undefined) {
            result[key] = value;
        } else if (key === 'AND' || key === 'NOT') {
            result[key] = [...asArray(current), ...asArray(value)];
        } else {
            conflicts.push({ [key]: value });
        }
    }

    if (conflicts.length > 0) {
        result.AND = [...(result.AND === undefined ? [] : asArray(result.AND)), ...conflicts];
    }

    return result as T;
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [value];
}
