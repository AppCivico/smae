/**
 * Regra local: proíbe operadores JS nativos em valores `Decimal` (Prisma.Decimal / decimal.js).
 *
 * Motivo: `Decimal.prototype.valueOf()` retorna uma *string*. Por isso o TypeScript aceita
 * `a < b` entre dois Decimals (mesma regra que permite `date1 < date2`), mas a comparação
 * acontece lexicograficamente sobre as strings:
 *
 *     new Decimal('9.99') >= new Decimal('10.1')  // true  (errado)
 *     new Decimal('2') < new Decimal('10')        // false (errado)
 *     new Decimal('1') + new Decimal('2')         // '12'  (concatenação)
 *
 * O bug não gera erro de compilação e depende da quantidade de dígitos, então passa
 * despercebido em testes ("2.50 < 10.00" por acaso acerta) e falha em produção.
 *
 * Use os métodos do Decimal: .lt() .lte() .gt() .gte() .eq() .plus() .minus() .times() .div()
 */

const ts = require('typescript');

const COMPARISON_SUGGESTION = {
    '<': '.lt()',
    '<=': '.lte()',
    '>': '.gt()',
    '>=': '.gte()',
};

const ARITHMETIC_SUGGESTION = {
    '+': '.plus()',
    '-': '.minus()',
    '*': '.times()',
    '/': '.div()',
    '%': '.mod()',
};

const EQUALITY_SUGGESTION = {
    '==': '.eq()',
    '!=': '!a.eq(b)',
    '===': '.eq()',
    '!==': '!a.eq(b)',
};

function isNullish(node) {
    return (
        (node.type === 'Literal' && node.value === null) ||
        (node.type === 'Identifier' && node.name === 'undefined')
    );
}

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Proíbe operadores nativos (< > <= >= + - * / %) em valores Decimal, que comparam/concatenam strings silenciosamente',
        },
        schema: [],
        messages: {
            comparison:
                'Comparação `{{op}}` entre Decimal compara as strings lexicograficamente (9.99 >= 10.1 é `true`). Use {{suggestion}}.',
            arithmetic:
                'Operador `{{op}}` em Decimal opera sobre a string do valueOf() (`+` concatena, os demais viram NaN se não for numérico). Use {{suggestion}}.',
            equality:
                'Comparação `{{op}}` entre Decimal compara referências de objeto, não valores. Use {{suggestion}}.',
            sort: 'Array.prototype.sort() sem comparador ordena Decimal[] como string ([10.1, 2] fica fora de ordem). Use .sort((a, b) => a.comparedTo(b)).',
        },
    },

    create(context) {
        const services = context.sourceCode.parserServices;
        if (!services || !services.program || !services.esTreeNodeToTSNodeMap) return {};

        const checker = services.program.getTypeChecker();

        const typeOf = (node) => {
            const tsNode = services.esTreeNodeToTSNodeMap.get(node);
            return tsNode ? checker.getTypeAtLocation(tsNode) : undefined;
        };

        const isDecimal = (type, depth = 0) => {
            if (!type || depth > 4) return false;
            if (type.isUnionOrIntersection()) return type.types.some((t) => isDecimal(t, depth + 1));
            const symbol = type.getSymbol() || type.aliasSymbol;
            return !!symbol && symbol.getName() === 'Decimal';
        };

        return {
            BinaryExpression(node) {
                const op = node.operator;
                const kind = COMPARISON_SUGGESTION[op]
                    ? 'comparison'
                    : ARITHMETIC_SUGGESTION[op]
                      ? 'arithmetic'
                      : EQUALITY_SUGGESTION[op]
                        ? 'equality'
                        : null;
                if (!kind) return;

                // `decimal === null` / `decimal !== undefined` são checagens legítimas
                if (kind === 'equality' && (isNullish(node.left) || isNullish(node.right))) return;

                if (!isDecimal(typeOf(node.left)) && !isDecimal(typeOf(node.right))) return;

                context.report({
                    node,
                    messageId: kind,
                    data: {
                        op,
                        suggestion:
                            COMPARISON_SUGGESTION[op] ?? ARITHMETIC_SUGGESTION[op] ?? EQUALITY_SUGGESTION[op],
                    },
                });
            },

            // [d('10.1'), d('2')].sort() -> ordenação lexicográfica
            'CallExpression[arguments.length=0]'(node) {
                const callee = node.callee;
                if (
                    callee.type !== 'MemberExpression' ||
                    callee.computed ||
                    callee.property.type !== 'Identifier' ||
                    callee.property.name !== 'sort'
                )
                    return;

                const objectType = typeOf(callee.object);
                if (!objectType) return;

                const elementType = checker.getIndexTypeOfType(objectType, ts.IndexKind.Number);
                if (!isDecimal(elementType)) return;

                context.report({ node, messageId: 'sort' });
            },
        };
    },
};
