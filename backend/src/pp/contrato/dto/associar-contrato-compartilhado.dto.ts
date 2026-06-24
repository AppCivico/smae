import { IsInt } from 'class-validator';

export class AssociarContratoCompartilhadoDto {
    @IsInt({ message: 'contrato_id precisa ser um número inteiro' })
    contrato_id: number;
}
