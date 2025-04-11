import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUnidadeMedidaDto {
    /**
     * Sigla/abreviação da unidade de medida
     * @example "cm"
     */
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| sigla: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| sigla: Máximo 250 caracteres' })
    sigla: string;
    /**
     * unidade
     * @example "centímetros"
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descrição: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string;
}
