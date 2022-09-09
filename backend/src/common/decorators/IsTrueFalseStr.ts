import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsTrueFalseString(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsTrueFalseString',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: {
                message: '$property| Envie "true" ou "false"',
                ...validationOptions,
            },
            validator: {
                validate(value: any) {
                    return value === 'true' || value === 'false';
                },
            },

        });
    };
}
