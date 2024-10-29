import { ValidationError } from '@nestjs/common';

export function FormatValidationErrors(errors: ValidationError[]): string[] {
    return errors.reduce((acc: string[], error) => {
        if (error.constraints) {
            acc.push(...Object.values(error.constraints));
        }
        if (error.children && error.children.length > 0) {
            acc.push(...FormatValidationErrors(error.children));
        }
        return acc;
    }, []);
}
