import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateOdsDto {
    /**
     * Número
     * @example 1
     */
    @IsInt({ message: '$property| Número precisa ser positivo' })
    @Type(() => Number)
    numero: number;

    /**
     * Título
     * @example "Erradicar Pobreza"
     */
    @IsString({ message: '$property| Título: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| Título: Mínimo de 1 caracteres' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    titulo: string;

    /**
     * Descrição
     */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Descrição: Mínimo de 4 caracteres' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;
}
