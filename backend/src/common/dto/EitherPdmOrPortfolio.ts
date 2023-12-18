import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'EitherPdmOrPortfolio', async: false })
export class EitherPdmOrPortfolio implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const { pdm_id, portfolio_id } = args.object as any;

        // verifica se tem um ou o outro, mas não ambos ao mesmo tempo
        // não temos ID 0, então pode enviar 0 no que não for usar
        let ok = (pdm_id && !portfolio_id) || (!pdm_id && portfolio_id);

        if (ok) {
            if (pdm_id && !Number.isInteger(+pdm_id)) ok = false;
            if (portfolio_id && !Number.isInteger(+portfolio_id)) ok = false;
        }

        return ok;
    }

    defaultMessage(_args: ValidationArguments) {
        return '$property| É necessário obrigatoriamente enviar pdm_id ou portfolio_id.';
    }
}
