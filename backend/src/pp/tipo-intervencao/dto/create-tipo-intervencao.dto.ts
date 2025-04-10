import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTipoIntervencaoDto {
    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;

    @IsOptional()
    @IsString({ message: '$property| conceito: Precisa ser alfanumérico' })
    @MaxLength(255, { message: 'O campo "Conceito" deve ter no máximo 255 caracteres' })
    conceito?: string;
}
