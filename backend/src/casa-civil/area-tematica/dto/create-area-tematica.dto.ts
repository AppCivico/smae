import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { MAX_LENGTH_DEFAULT } from '../../../common/consts';

export class CreateAcaoDto {
    @IsOptional()
    @IsInt({ message: 'id precisa ser um número' })
    id?: number;

    @IsString({ message: 'nome precisa ser uma string' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `nome deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @IsBoolean({ message: 'ativo precisa ser um booleano' })
    ativo: boolean;
}

export class CreateAreaTematicaDto {
    @IsString({ message: 'nome precisa ser uma string' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `nome deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @IsOptional()
    @IsBoolean({ message: 'ativo precisa ser um booleano' })
    ativo?: boolean;

    @IsOptional()
    @IsArray({ message: 'acoes precisa ser um array' })
    @ArrayMinSize(1, { message: 'acoes deve ter pelo menos 1 item' })
    @ValidateNested({ each: true })
    @Type(() => CreateAcaoDto)
    acoes?: CreateAcaoDto[];
}
