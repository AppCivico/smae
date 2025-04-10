import { ApiProperty } from '@nestjs/swagger';
import { Periodicidade } from '@prisma/client';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreatePainelDto {
    @IsString()
    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    nome: string;

    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', '),
    })
    periodicidade: Periodicidade;

    @IsBoolean()
    mostrar_planejado_por_padrao: boolean;

    @IsBoolean()
    mostrar_acumulado_por_padrao: boolean;

    @IsBoolean()
    mostrar_indicador_por_padrao: boolean;

    @IsBoolean()
    ativo: boolean;

    @IsArray()
    @IsOptional()
    @ArrayMinSize(1, { message: '$property| grupo(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| grupo(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    grupos?: number[];
}
