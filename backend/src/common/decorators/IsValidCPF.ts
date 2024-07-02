import { registerDecorator, ValidationOptions } from 'class-validator';

function isValidCPF(value: string) {
    // Se não for string, o CPF é inválido
    if (typeof value !== 'string') {
        return false;
    }

    // Remove todos os caracteres que não sejam números
    value = value.replace(/[^\d]+/g, '');

    // Se o CPF não tem 11 dígitos ou todos os dígitos são repetidos, o CPF é inválido
    if (value.length !== 11 || !!value.match(/(\d)\1{10}/)) {
        return false;
    }

    // Transforma de string para number[] com cada dígito sendo um número no array
    const digits = value.split('').map((el) => +el);

    // Função que calcula o dígito verificador de acordo com a fórmula da Receita Federal
    function getVerifyingDigit(arr: number[], base: number) {
        const reduced = arr.reduce((sum, digit, index) => sum + digit * (base - index), 0);
        return ((reduced * 10) % 11) % 10;
    }

    // O CPF é válido se, e somente se, os dígitos verificadores estão corretos
    return (
        getVerifyingDigit(digits.slice(0, 9), 10) === digits[9] &&
        getVerifyingDigit(digits.slice(0, 10), 11) === digits[10]
    );
}

export function IsValidCPF(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsValidCPF',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: {
                message: '$property| CPF inválido, envie no formato 000.000.000-00',
                ...validationOptions,
            },
            validator: {
                validate(value: any) {
                    if (typeof value == 'string' && value.length === 14 && value.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/))
                        return isValidCPF(value);

                    return false;
                },
            },
        });
    };
}
