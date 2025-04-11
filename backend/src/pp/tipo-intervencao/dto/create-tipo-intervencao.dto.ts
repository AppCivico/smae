import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTipoIntervencaoDto {
    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    nome: string;

    @IsOptional()
    @IsString({ message: '$property| conceito: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| conceito: Máximo 250 caracteres' })
    conceito?: string;
}
