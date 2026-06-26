import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class AssociarContratoCompartilhadoDto {
    @IsArray({ message: 'contrato_ids precisa ser uma array de números inteiros' })
    @ArrayMinSize(1, { message: 'contrato_ids precisa ter ao menos 1 item' })
    @ArrayMaxSize(100, { message: 'contrato_ids precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: 'Cada contrato_id precisa ser um número inteiro' })
    contrato_ids: number[];
}
