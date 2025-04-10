import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { TipoVariavelCategorica } from '@prisma/client';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { IdNomeExibicao } from '../../meta/entities/meta.entity';
import { Transform, Type } from 'class-transformer';
import { NumberTransform } from '../../auth/transforms/number.transform';

export class CreateVariavelCategoricaValorDto {
    /**
     * ID da variável categórica, se for nulo, será criado um novo
     */
    @IsOptional()
    @IsInt()
    id: number | null;

    @IsInt()
    @IsOptional()
    ordem: number;

    @IsInt()
    valor_variavel: number;

    @IsString()
    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    titulo: string;

    @IsString()
    @IsOptional()
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string | null;
}

export class CreateVariavelCategoricaDto {
    @IsEnum(TipoVariavelCategorica)
    @ApiProperty({
        description: 'Tipo de variável categórica',
        enum: TipoVariavelCategorica,
        enumName: 'TipoVariavelCategorica',
    })
    tipo: TipoVariavelCategorica;

    /**
     * Valores da variável categórica
     */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(1, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(1000, { message: '$property| precisa ter no máximo 1000 items' })
    @ValidateNested({ each: true })
    @Type(() => CreateVariavelCategoricaValorDto)
    valores: CreateVariavelCategoricaValorDto[]; // manter undefined pq precisamos apagar antes do insert

    @IsString()
    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    titulo: string;

    @IsString()
    @IsOptional()
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string | null;
}

export class UpdateVariavelCategoricaDto extends OmitType(PartialType(CreateVariavelCategoricaDto), [
    'tipo',
] as const) {}

export class VariavelCategoricaValorItem {
    id: number;
    titulo: string;
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string | null;
    valor_variavel: number;
    ordem: number;

    criador: IdNomeExibicao | null;
    criado_em: Date;
    atualizador: IdNomeExibicao | null;
    atualizado_em: Date | null;
}

export class VariavelCategoricaItem {
    id: number;
    titulo: string;
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string | null;
    tipo: TipoVariavelCategorica;
    valores: VariavelCategoricaValorItem[];
    pode_editar: boolean;
}

export class FilterVariavelCategoricaDto {
    @IsOptional()
    @IsEnum(TipoVariavelCategorica)
    @ApiProperty({
        description: 'Filtrar por tipo de variável categórica',
        enum: TipoVariavelCategorica,
        enumName: 'TipoVariavelCategorica',
    })
    tipo?: TipoVariavelCategorica;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    id?: number;
}

export class ListVariavelCategoricaDto {
    linhas: VariavelCategoricaItem[];
}
