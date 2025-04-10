import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaHistoricoAcao, TransferenciaTipoEsfera } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, IsInt, Max, Min, IsEnum, IsBoolean } from 'class-validator';

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
    @IsInt()
    @Type(() => Number)
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
    @Transform(({ value }: any) => value === 'true')
    preenchimento_completo?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(255, {message: 'O campo "Palavra chave" deve ter no máximo 255 caracteres'})
    palavra_chave?: string;
}

export class FilterTransferenciaHistoricoDto {
    @IsOptional()
    @ApiProperty({ enum: TransferenciaHistoricoAcao, enumName: 'TransferenciaHistoricoAcao', isArray: true })
    @IsEnum(TransferenciaHistoricoAcao, {
        each: true,
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaHistoricoAcao).join(', '),
    })
    acao?: TransferenciaHistoricoAcao[];
}
