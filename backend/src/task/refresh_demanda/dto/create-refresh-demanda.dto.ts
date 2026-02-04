import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';

export enum RefreshDemandaCacheType {
    geocamadas = 'geocamadas',
    geopoints = 'geopoints',
    summary = 'summary',
    full = 'full',
    individual = 'individual',
}

export class CreateRefreshDemandaDto {
    @IsOptional()
    @IsBoolean()
    force_geocamadas?: boolean;

    @IsOptional()
    @IsBoolean()
    force_all?: boolean;

    @IsOptional()
    @IsInt()
    demanda_id?: number;

    @IsOptional()
    @IsEnum(RefreshDemandaCacheType)
    cache_type?: RefreshDemandaCacheType;
}
