import { ComunicadoTipo } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { DateTransform } from '../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';

export class TransfereGovDto {
    id: number;
    numero: number;
    ano: number;
    titulo: string;
    link: string;
    data: Date;
    descricao: string | null;
    tipo: ComunicadoTipo;
}

export class FilterTransfereGovListDto {
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
    @IsNumber()
    @Type(() => Number)
    @Max(1000)
    @Min(1)
    ipp?: number = 25;

    @IsOptional()
    @IsEnum(ComunicadoTipo)
    tipo?: ComunicadoTipo;
}

export class TransfereGovSyncDto {
    novos_itens: number[];
}
