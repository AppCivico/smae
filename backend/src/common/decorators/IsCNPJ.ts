import { registerDecorator, ValidationOptions } from 'class-validator';
import { CnpjValidator } from '../../auth/validators/cnpj.validator';

export function IsCNPJ(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsCNPJ',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: {
                message: '$property precisa ser um CNPJ válido',
                ...validationOptions,
            },
            validator: {
                validate(value: any) {
                    if (!value) return false;

                    const cnpj = String(value);

                    const validator = new CnpjValidator();
                    return validator.validate(cnpj, null as any);
                },
            },
        });
    };
}
