import { BadRequestException } from '@nestjs/common';
import { FonteRelatorio } from '@prisma/client';
import { registerDecorator, validate, ValidationArguments, ValidationOptions } from 'class-validator';
import { ParseParametrosDaFonte } from '../utils/utils.service';

export function ReportValidatorOf(property: string, validationOptions?: ValidationOptions) {
    return function (value: Object, propertyName: string) {
        registerDecorator({
            name: 'ReportValidator',
            target: value.constructor,
            propertyName: propertyName,
            constraints: [property],
            async: true,
            options: {
                message: `$property| Envie os parâmetros de acordo com a ${property}`,
                ...validationOptions,
            },
            validator: {
                async validate(value: any, args: ValidationArguments) {
                    if (!value || typeof value !== 'object') throw new BadRequestException('Informe os parâmetros da fonte');

                    const [fonteNome] = args.constraints;
                    const fonte = (args.object as any)[fonteNome] as FonteRelatorio;

                    const validatorObject = ParseParametrosDaFonte(fonte, value);
                    const validations = await validate(validatorObject);
                    if (validations.length) {
                        throw new BadRequestException(
                            validations.reduce((acc, curr) => {
                                return [...acc, ...Object.values(curr.constraints as any)];
                            }, [])
                        );
                    }

                    return true;
                },
            },
        });
    };
}
