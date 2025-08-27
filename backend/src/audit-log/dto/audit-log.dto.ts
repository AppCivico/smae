import { OmitType } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class FilterAuditLogDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    pessoa_id?: number;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    contexto?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    log_contem?: string; // busca no campo 'log'

    @IsOptional()
    @IsString()
    @MaxLength(45)
    ip?: string;

    @IsOptional()
    @IsDateString({ strictSeparator: true, strict: true })
    criado_em_inicio?: string;

    @IsOptional()
    @IsDateString({ strictSeparator: true, strict: true })
    criado_em_fim?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    token_proxima_pagina?: string;

    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    ipp?: number;
}

export class GroupByFilterDto extends OmitType(FilterAuditLogDto, ['token_proxima_pagina', 'ipp']) {}

export class GroupByFieldsDto {
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    group_by_date?: boolean;

    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    group_by_contexto?: boolean;

    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    group_by_pessoa_id?: boolean;
}
