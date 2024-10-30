import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsOnlyDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsOnlyDate',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: {
                message: '$property| Envie no formato YYYY-MM-DD',
                ...validationOptions,
            },
            validator: {
                validate(value: any) {
                    // é uma data, e não tem o horário setado
                    if (value instanceof Date && !isNaN(value as any)) {
                        const str = value.toISOString();
                        console.log('str', str);
                        const isValidDate = /T00:00:00/.test(value.toISOString());

                        const isYearValid = value.getFullYear() <= 9999;
                        return isValidDate && isYearValid;
                    }
                    return false;
                },
            },
        });
    };
}
