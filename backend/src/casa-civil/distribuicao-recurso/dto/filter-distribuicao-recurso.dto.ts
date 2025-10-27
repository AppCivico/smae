import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { NumberTransformOrUndef } from 'src/auth/transforms/number.transform';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class FilterDistribuicaoRecursoDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    transferencia_id?: number;

    /**
     * Token para buscar próxima página
     */
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    token_proxima_pagina?: string;

    /**
     * Itens por página, padrão 50
     * @example "50"
     */
    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform(NumberTransformOrUndef)
    ipp?: number;

    // Esse filtro será aplicado em Transferências
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    ano?: number;

    // Esse filtro será aplicado em Transferências
    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    esfera?: TransferenciaTipoEsfera;

    // Esse filtro será aplicado em Transferências
    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Palavra-Chave' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    palavra_chave?: string;

    @IsOptional()
    @IsString()
    order_by?: string;
}
