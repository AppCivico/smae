import { BadRequestException } from '@nestjs/common';
import { ValidationOptions, registerDecorator, ValidationArguments } from 'class-validator';
import { valid as gjv_valid } from 'geojson-validation';

export function IsGeoJSON(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isGeoJSON',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const trace = gjv_valid(value, true);
                    if (trace.length) throw new BadRequestException({ error: `${args.property} invalid`, message: trace });

                    return true;
                },
            },
        });
    };
}
