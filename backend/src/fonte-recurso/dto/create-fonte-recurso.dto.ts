import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateFonteRecursoDto {
    /**
     * Sigla
     */
    @IsOptional()
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Sigla' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    sigla?: string | null;

    /**
     * Fonte
     */
    @IsString({ message: '$property| Fonte: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| Fonte: Mínimo de 1 caractere' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Fonte' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    fonte: string;
}
