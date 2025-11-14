import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateOdsDto {
    /**
     * Número
     * @example 1
     */
    @IsInt({ message: 'Número precisa ser positivo' })
    @Type(() => Number)
    numero: number;

    /**
     * Título
     * @example "Erradicar Pobreza"
     */
    @IsString({ message: 'Título: Precisa ser alfanumérico' })
    @MinLength(1, { message: 'Título: Mínimo de 1 caracteres' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    titulo: string;

    /**
     * Descrição
     */
    @IsString({ message: 'Descrição: Precisa ser alfanumérico' })
    @MinLength(4, { message: 'Descrição: Mínimo de 4 caracteres' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;
}
