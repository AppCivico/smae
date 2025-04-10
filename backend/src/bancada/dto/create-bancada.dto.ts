import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBancadaDto {
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(255, {message: 'O campo "Sigla" deve ter no máximo 255 caracteres'})
    sigla: string;

    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(255, {message: 'O campo "Nome" deve ter no máximo 255 caracteres'})
    nome: string;

    @IsOptional()
    @IsString({ message: 'Precisa ser alfanumérico' })
    @MaxLength(2048, { message: 'O campo "Descrição" pode ser no máximo 2048 caracteres' })
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
