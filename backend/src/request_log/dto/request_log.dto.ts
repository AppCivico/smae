import { OmitType } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class FilterRequestLogDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    created_pessoa_id?: number;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    req_method?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    req_path_starts_with?: string;

    @IsOptional()
    @IsInt()
    @Max(599) // HTTP status codes range from 100 to 599
    @Min(100)
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    res_code?: number;

    @IsOptional()
    @IsDateString({ strictSeparator: true, strict: true })
    created_at_start?: string;

    @IsOptional()
    @IsDateString({ strictSeparator: true, strict: true })
    created_at_end?: string;

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

export class GroupByFilterDto extends OmitType(FilterRequestLogDto, ['token_proxima_pagina', 'ipp']) {}

export class GroupByFieldsDto {
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    group_by_request_date?: boolean;

    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    group_by_req_method?: boolean;

    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    group_by_req_path_clean?: boolean;

    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    group_by_res_code?: boolean;
}
