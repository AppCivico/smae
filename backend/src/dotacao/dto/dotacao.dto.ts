import { IsString, Matches, MaxLength } from "class-validator";

export class ValidateDotacaoDto {
    /**
    * dotacao: esperado exatamente
    * @example "00.00.00.000.0000.0.000.00000000.00"
    */
    @IsString()
    @MaxLength(40)
    @Matches(/^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{4}\.\d\.\d{3}\.\d{8}\.\d{2}$/, { message: 'Dotação não está no formato esperado: 00.00.00.000.0000.0.000.00000000.00' })
    dotacao: string;
}
