import { BadRequestException } from '@nestjs/common';
import { registerDecorator, validate, ValidationArguments, ValidationOptions, ValidatorConstraint } from 'class-validator';
import { CreateOrcamentoExecutadoDto } from '../orcamento/dto/create-orcamento-executado.dto';
import { plainToClass } from 'class-transformer';

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

                    const [fonteNome] = args.constraints;
                    const fonte = (args.object as any)[fonteNome];

                    const validatorObject = plainToClass(CreateOrcamentoExecutadoDto, value);

                    const validations = await validate(validatorObject);

                    if (validations.length) {
                        throw new BadRequestException(
                            validations.reduce((acc, curr) => {
                                return [...acc, ...Object.values(curr.constraints as any)];
                            }, []),
                        );
                    }

                    // é uma data, e não tem o horário setado
                    return true;
                },
            },

        });
    };
}
