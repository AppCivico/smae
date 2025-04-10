import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFonteRecursoDto {
    /**
     * Sigla
     */
    @IsOptional()
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(255, {message: 'O campo "Sigla" deve ter no máximo 255 caracteres'})
    sigla?: string | null;

    /**
     * Fonte
     */
    @IsString({ message: '$property| Fonte: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| Fonte: Mínimo de 1 caractere' })
    @MaxLength(255, {message: 'O campo "Fonte" deve ter no máximo 255 caracteres'})
    fonte: string;
}
