import { ApiProperty } from '@nestjs/swagger';
import { DemandaStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';

export class CreateRelDemandasDto {
    /**
     * Filtro por status (múltipla escolha)
     */
    @IsOptional()
    @IsArray()
    @ApiProperty({ enum: DemandaStatus, isArray: true, enumName: 'DemandaStatus' })
    @IsEnum(DemandaStatus, {
        each: true,
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(DemandaStatus).join(', '),
    })
    @Expose()
    status?: DemandaStatus[];

    /**
     * Filtro por data de registro inicial
     */
    @IsOptional()
    @IsDateString()
    @Expose()
    data_registro_inicio?: string;

    /**
     * Filtro por data de registro final
     */
    @IsOptional()
    @IsDateString()
    @Expose()
    data_registro_fim?: string;

    /**
     * Filtro por órgão (Gestor Municipal)
     */
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Expose()
    orgao_id?: number;

    /**
     * Filtro por área temática
     */
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Expose()
    area_tematica_id?: number;
}
