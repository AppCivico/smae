import { BadRequestException } from '@nestjs/common';
import { task_type } from 'src/generated/prisma/client';
import { registerDecorator, validate, ValidationArguments, ValidationOptions } from 'class-validator';
import { ParseParams } from './task.parseParams';
import { FormatValidationErrors } from '../common/helpers/FormatValidationErrors';

export function TaskValidatorOf(property: string, validationOptions?: ValidationOptions) {
    return function (value: Object, propertyName: string) {
        registerDecorator({
            name: 'TaskValidator',
            target: value.constructor,
            propertyName: propertyName,
            constraints: [property],
            async: true,
            options: {
                message: `$property| Params não passou na validação!`,
                ...validationOptions,
            },
            validator: {
                async validate(value: any, args: ValidationArguments) {
                    if (!value || typeof value !== 'object')
                        throw new BadRequestException('Informe os parâmetros da tarefa');

                    const [fieldName] = args.constraints;
                    const taskType = (args.object as any)[fieldName] as task_type;

                    const validatorObject = ParseParams(taskType, value);
                    try {
                        const validations = await validate(validatorObject);
                        if (validations.length) {
                            throw new BadRequestException(FormatValidationErrors(validations));
                        }
                    } catch (error) {
                        console.log('Erro na validação dos parâmetros:', error);
                        if (error instanceof BadRequestException) throw error;

                        return false;
                    }
                    return true;
                },
            },
        });
    };
}
