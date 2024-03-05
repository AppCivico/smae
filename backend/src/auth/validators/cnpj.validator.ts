import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'cnpj', async: false })
export class CnpjValidator implements ValidatorConstraintInterface {
    validate(cnpj: string, _args: ValidationArguments) {
        if (!cnpj) return false;

        // Remove non-numeric characters from the CNPJ
        const cleanedCnpj = cnpj.replace(/[^\d]/g, '');

        // Check if the CNPJ has 14 digits
        if (cleanedCnpj.length !== 14) return false;

        // Check if all digits are the same (invalid CNPJ)
        if (/^(\d)\1*$/.test(cleanedCnpj)) return false;

        // Validate CNPJ algorithm
        let size = 12;
        let numbers = cleanedCnpj.substring(0, size);
        const digits = cleanedCnpj.substring(size);
        let sum = 0;
        let pos = size - 7;

        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i), 10) * pos--;
            if (pos < 2) pos = 9;
        }

        let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

        if (result !== parseInt(digits.charAt(0), 10)) return false;

        size = 13;
        numbers = cleanedCnpj.substring(0, size);
        sum = 0;
        pos = size - 7;

        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i), 10) * pos--;
            if (pos < 2) pos = 9;
        }

        result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

        if (result !== parseInt(digits.charAt(1), 10)) return false;

        return true;
    }

    defaultMessage(_args: ValidationArguments) {
        return 'CNPJ Inválido';
    }
}
