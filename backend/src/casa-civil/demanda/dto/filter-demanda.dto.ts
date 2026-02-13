import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { DemandaSituacao, DemandaStatus } from '@prisma/client';

export class FilterDemandaDto {
    @IsOptional()
    @IsEnum(DemandaStatus)
    status?: DemandaStatus;

    @IsOptional()
    @IsEnum(DemandaSituacao)
    situacao?: DemandaSituacao;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    orgao_id?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    area_tematica_id?: number;
}
