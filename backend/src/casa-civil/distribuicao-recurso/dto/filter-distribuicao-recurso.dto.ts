import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { NumberTransformOrUndef } from 'src/auth/transforms/number.transform';

export class FilterDistribuicaoRecursoDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    transferencia_id?: number;

    /**
     * Token para buscar próxima página
     */
    @ApiPropertyOptional({ description: 'Token para buscar a próxima página de resultados' })
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
}
