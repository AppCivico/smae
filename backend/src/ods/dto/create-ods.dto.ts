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
    @MaxLength(60, { message: '$property| Título: Máximo 60 caracteres' })
    titulo: string;

    /**
     * Descrição
     */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Descrição: Mínimo de 4 caracteres' })
    @MaxLength(250, { message: '$property| Descrição: Máximo 250 caracteres' })
    descricao: string;
}
