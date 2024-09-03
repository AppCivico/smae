import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';

export class FilterNotaComunicadoDto {
    @IsOptional()
    @IsBoolean()
    @Transform((a: TransformFnParams) => (a.value === 'true' ? true : a.value === 'false' ? false : a.value))
    lido?: boolean;

    @IsOptional()
    @IsString()
    palavra_chave?: string;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_inicio?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_fim?: Date;

    @IsOptional()
    @IsString()
    token_proxima_pagina?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => parseInt(value, 10))
    ipp?: number = 20;

    @IsOptional()
    @IsString()
    tipo?: string;
}

export class NotaComunicadoItemDto {
    id: number;
    titulo: string;
    conteudo: string;

    @ApiProperty({
        type: 'object',
        properties: { tipo: { type: 'string' }, numero: { type: 'number' }, ano: { type: 'number' } },
    })
    dados: Record<string, any> | null;

    data: Date;

    lido: boolean;
}

export class NotaComunicadoMarcarLidoDto {
    @IsBoolean()
    lido: boolean;
}
