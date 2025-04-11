import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFonteRecursoDto {
    /**
     * Sigla
     */
    @IsOptional()
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(20, { message: '$property| sigla: Máximo 20 caracteres' })
    sigla?: string | null;

    /**
     * Fonte
     */
    @IsString({ message: '$property| Fonte: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| Fonte: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| Fonte: Máximo 250 caracteres' })
    fonte: string;
}
