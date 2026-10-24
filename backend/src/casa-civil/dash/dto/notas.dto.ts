import { ApiProperty } from '@nestjs/swagger';
import { StatusNota } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';
import { FilterDashTransferenciasDto } from './transferencia.dto';

export class MfDashNotasDto {
    @ApiProperty({ description: 'ID da transferência' })
    transferencia_id: number;

    nota_id: number;

    bloco_id: number;
    nota: string;
    @IsDateYMD()
    data_nota: string;
    @IsDateYMD()
    data_ordenacao: string;

    status: StatusNota;

    transferencia_identificador: string;
}

export class FilterDashNotasDto extends FilterDashTransferenciasDto {
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
