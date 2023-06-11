import { ApiProperty } from '@nestjs/swagger';
import { CronogramaEtapaNivel } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, ValidateIf } from 'class-validator';

export class UpdateCronogramaEtapaDto {
    /**
     * inativo
     */
    @IsOptional()
    @IsBoolean()
    inativo?: boolean;

    /**
     * ordem
     */
    @IsInt({ message: '$property| ordem precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    ordem?: number;

    @IsNumber()
    cronograma_id: number;

    @IsNumber()
    etapa_id: number;
}
