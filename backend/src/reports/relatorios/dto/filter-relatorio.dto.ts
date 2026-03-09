import { ApiProperty } from '@nestjs/swagger';
import { FonteRelatorio } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class FilterRelatorioDto {
    /**
     * Filtrar por ID do relatório
     * @example ""
     */
    @IsOptional()
    @IsInt()
    @Transform(({ value }: any) => +value)
    id?: number;

    /**
     * Filtrar pdm_id ?
     * @example ""
     */
    @IsOptional()
    @IsInt()
    @Transform(({ value }: any) => +value)
    pdm_id?: number;

    /**
     * Filtrar fonte ?
     * @example ""
     */
    @IsOptional()
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', '),
    })
    fonte?: FonteRelatorio;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    /**
     * token pra buscar proxima pagina
     */
    token_proxima_pagina?: string;

    /**
     * itens por pagina, padrão 25
     * @example "25"
     */
    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    ipp?: number;
}
