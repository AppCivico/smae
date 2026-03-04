import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Valida se o valor é uma string numérica com limite de dígitos antes e após o ponto decimal
 */
function isNumberStringWithPrecision(
    value: any,
    maxDigitsBeforeDecimal: number,
    maxDigitsAfterDecimal: number
): boolean {
    // Se não for string, é inválido
    if (typeof value !== 'string') {
        return false;
    }

    // Remove espaços em branco
    const trimmed = value.trim();

    // Verifica se é vazio
    if (trimmed === '') {
        return false;
    }

    // Regex para validar formato de número (permite sinal negativo)
    const numberRegex = /^-?\d+(\.\d+)?$/;
    if (!numberRegex.test(trimmed)) {
        return false;
    }

    // Separa a parte inteira da decimal
    const parts = trimmed.replace(/^-/, '').split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    // Valida quantidade de dígitos antes do ponto
    if (integerPart.length > maxDigitsBeforeDecimal) {
        return false;
    }

    // Valida quantidade de dígitos após o ponto
    if (decimalPart.length > maxDigitsAfterDecimal) {
        return false;
    }

    return true;
}

export function IsNumberStringCustom(
    maxDigitsBeforeDecimal: number,
    maxDigitsAfterDecimal: number,
    validationOptions?: ValidationOptions
) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsNumberStringCustom',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [maxDigitsBeforeDecimal, maxDigitsAfterDecimal],
            options: {
                message: `Precisa ser um número com até ${maxDigitsBeforeDecimal} dígitos antes do ponto, e até ${maxDigitsAfterDecimal} dígitos após`,
                ...validationOptions,
            },
            validator: {
                validate(value: any) {
                    return isNumberStringWithPrecision(value, maxDigitsBeforeDecimal, maxDigitsAfterDecimal);
                },
            },
        });
    };
}
