import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { DemandaStatus } from '@prisma/client';

export class FilterDemandaDto {
    @IsOptional()
    @IsEnum(DemandaStatus)
    status?: DemandaStatus;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    orgao_id?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    area_tematica_id?: number;
}
