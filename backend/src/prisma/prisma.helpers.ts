/**
 * PrismaMerge: Mescla com segurança dois objetos de condição where do Prisma do mesmo tipo.
 *
 * Lida com condições aninhadas AND, OR e NOT combinando-as em um único array (para AND/OR)
 * ou envolvendo-as em um array (para NOT), garantindo o agrupamento lógico correto para consultas complexas.
 *
 * Por que usar isso?
 *  - Ao construir consultas dinâmicas do Prisma, você frequentemente precisa combinar vários filtros (ex.: filtros de usuário + filtros do sistema).
 *  - Mesclar objetos de forma ingênua pode quebrar o agrupamento lógico, especialmente para AND/OR/NOT, levando a resultados incorretos.
 *  - Este utilitário garante que os operadores lógicos sejam mesclados de forma a preservar a semântica pretendida da consulta.
 *
 * Exemplo:
 *   PrismaMerge(
 *     { AND: [{ a: 1 }], OR: [{ b: 2 }], NOT: { c: 3 }, d: 4 },
 *     { AND: [{ x: 9 }], OR: [{ y: 8 }], NOT: { z: 7 }, d: 5, e: 6 }
 *   )
 *   // => {
 *   //   AND: [{ a: 1 }, { x: 9 }],
 *   //   OR: [{ b: 2 }, { y: 8 }],
 *   //   NOT: [{ c: 3 }, { z: 7 }],
 *   //   d: 5,
 *   //   e: 6
 *   // }
 *
 * @param base O objeto de condição where base
 * @param extension A condição where adicional a ser mesclada
 * @returns Uma nova condição where mesclada com o mesmo tipo das entradas
 */
export function PrismaMerge<T extends object>(base: T, extension: T): T {
    // Cria uma cópia superficial do objeto base para evitar mutação
    const result = { ...base };

    // Tratamento especial para condições AND
    if ('AND' in base && 'AND' in extension) {
        const baseAnd = (base as any).AND;
        const extensionAnd = (extension as any).AND;
        if (Array.isArray(baseAnd) && Array.isArray(extensionAnd)) {
            (result as any).AND = [...baseAnd, ...extensionAnd];
        } else if (Array.isArray(baseAnd)) {
            (result as any).AND = [...baseAnd, extensionAnd];
        } else if (Array.isArray(extensionAnd)) {
            (result as any).AND = [baseAnd, ...extensionAnd];
        } else {
            (result as any).AND = [baseAnd, extensionAnd];
        }
    }
    // Tratamento especial para condições OR
    else if ('OR' in base && 'OR' in extension) {
        const baseOr = (base as any).OR;
        const extensionOr = (extension as any).OR;
        if (Array.isArray(baseOr) && Array.isArray(extensionOr)) {
            (result as any).OR = [...baseOr, ...extensionOr];
        } else if (Array.isArray(baseOr)) {
            (result as any).OR = [...baseOr, extensionOr];
        } else if (Array.isArray(extensionOr)) {
            (result as any).OR = [baseOr, ...extensionOr];
        } else {
            (result as any).OR = [baseOr, extensionOr];
        }
    }
    // Tratamento especial para condições NOT
    else if ('NOT' in base && 'NOT' in extension) {
        const baseNot = (base as any).NOT;
        const extensionNot = (extension as any).NOT;
        if (Array.isArray(baseNot) && Array.isArray(extensionNot)) {
            (result as any).NOT = [...baseNot, ...extensionNot];
        } else if (Array.isArray(baseNot)) {
            (result as any).NOT = [...baseNot, extensionNot];
        } else if (Array.isArray(extensionNot)) {
            (result as any).NOT = [baseNot, ...extensionNot];
        } else {
            (result as any).NOT = [baseNot, extensionNot];
        }
    } else {
        // Para outras propriedades, mescle-as da extensão para o resultado
        Object.entries(extension).forEach(([key, value]) => {
            if (value !== undefined && !(key in result && (result as any)[key] === undefined)) {
                (result as any)[key] = value;
            }
        });
    }

    return result;
}
