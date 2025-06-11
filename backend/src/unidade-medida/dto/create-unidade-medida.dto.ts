import { IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateUnidadeMedidaDto {
    /**
     * Sigla/abreviação da unidade de medida
     * @example "cm"
     */
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| sigla: Mínimo de 1 caractere' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Sigla' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    sigla: string;
    /**
     * unidade
     * @example "centímetros"
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descrição: Mínimo de 1 caractere' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;
}
