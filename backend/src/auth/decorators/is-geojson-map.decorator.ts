import { BadRequestException } from '@nestjs/common';
import { ValidationOptions, registerDecorator, ValidationArguments } from 'class-validator';
import { valid as gjv_valid } from 'geojson-validation';

export function IsGeoJSONMap(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isGeoJSONMap',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (!value) return true;

                    for (const key in value) {
                        if (Object.prototype.hasOwnProperty.call(object, key)) {
                            const element = value[key];
                            const trace = gjv_valid(element, true);
                            if (trace.length)
                                throw new BadRequestException({
                                    error: `${args.property}[${key}] invalid`,
                                    message: trace,
                                });
                        }
                    }

                    return true;
                },
            },
        });
    };
}
