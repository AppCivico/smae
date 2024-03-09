import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBancadaDto {
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(20, { message: '$property| sigla: Máximo 20 caracteres' })
    sigla: string;

    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    nome: string;

    @IsOptional()
    @IsString({ message: '$property| descricao: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descricao: Máximo 250 caracteres' })
    descricao?: string;

    @IsOptional()
    @IsArray({
        message: '$property| Partidos: precisa ser uma array.',
    })
    @ArrayMaxSize(100, {
        message: '$property| Partidos: pode ter no máximo 100 items',
    })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    partido_ids?: number[];
}
