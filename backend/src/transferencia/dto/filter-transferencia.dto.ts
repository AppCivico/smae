import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsOptional, IsString, MaxLength, IsInt, Max, Min, IsNumber, IsEnum, IsBoolean } from 'class-validator';

export class FilterTransferenciaDto {
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

    @IsOptional()
    @IsNumber()
    ano?: number;

    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    esfera?: TransferenciaTipoEsfera;

    @IsOptional()
    @IsBoolean()
    preenchimento_completo?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    palavra_chave?: string;
}
