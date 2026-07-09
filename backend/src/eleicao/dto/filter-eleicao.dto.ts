import { ApiPropertyOptional } from '@nestjs/swagger';
import { EleicaoTipo } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class FilterEleicaoDto {
    @ApiPropertyOptional({ enum: EleicaoTipo, enumName: 'EleicaoTipo' })
    @IsOptional()
    @IsEnum(EleicaoTipo)
    tipo?: EleicaoTipo;

    @ApiPropertyOptional({ description: 'Ano da eleição' })
    @IsOptional()
    @IsInt()
    @Min(1900)
    @Max(2100)
    @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : +value))
    ano?: number;

    @ApiPropertyOptional({ description: 'Filtrar apenas eleições atuais para mandatos' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return value;
    })
    atual_para_mandatos?: boolean;
}
