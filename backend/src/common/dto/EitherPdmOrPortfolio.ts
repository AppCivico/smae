import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'EitherPdmOrPortfolio', async: false })
export class EitherPdmOrPortfolio implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const { pdm_id, portfolio_id, transferencia_id } = args.object as any;

        // exatamente um dos três; não temos ID 0, então pode enviar 0 no que não for usar
        const enviados = [pdm_id, portfolio_id, transferencia_id].filter((v) => v);
        if (enviados.length != 1) return false;

        return Number.isInteger(+enviados[0]);
    }

    defaultMessage(_args: ValidationArguments) {
        return '$property| É necessário obrigatoriamente enviar pdm_id, portfolio_id ou transferencia_id.';
    }
}
