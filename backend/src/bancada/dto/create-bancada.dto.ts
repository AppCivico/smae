import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateBancadaDto {
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Sigla' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    sigla: string;

    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @IsOptional()
    @IsString({ message: 'Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
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
