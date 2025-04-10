import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUnidadeMedidaDto {
    /**
     * Sigla/abreviação da unidade de medida
     * @example "cm"
     */
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| sigla: Mínimo de 1 caractere' })
    @MaxLength(255, { message: 'O campo "Sigla" deve ter no máximo 255 caracteres' })
    sigla: string;
    /**
     * unidade
     * @example "centímetros"
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descrição: Mínimo de 1 caractere' })
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string;
}
