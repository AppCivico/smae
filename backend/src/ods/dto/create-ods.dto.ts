import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';

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
    @MaxLength(255, {message: 'O campo "Título" deve ter no máximo 255 caracteres'})
    titulo: string;

    /**
     * Descrição
     */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Descrição: Mínimo de 4 caracteres' })
    @MaxLength(2048, {message: 'O campo "Descrição" deve ter no máximo 2048 caracteres'})
    descricao: string;
}
