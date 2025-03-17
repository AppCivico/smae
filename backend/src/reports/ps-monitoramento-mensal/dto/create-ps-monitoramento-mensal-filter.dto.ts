import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';

export class CreatePsMonitoramentoMensalFilterDto {
    @IsOptional()
    @IsInt()
    @ApiProperty({ deprecated: true, description: 'Use pdm_id' })
    @Expose()
    plano_setorial_id?: number;

    @IsOptional()
    @IsInt()
    @Expose()
    pdm_id?: number;

    @IsOptional()
    @IsEnum(TipoPdm)
    @Expose()
    tipo_pdm?: TipoPdm;

    @IsInt()
    @Transform(({ value }: any) => +value)
    @Max(12)
    @Min(1)
    @Expose()
    mes: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    @Min(1500)
    @Max(9999)
    @Expose()
    ano: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    @Expose()
    conferida?: boolean;

    @IsOptional()
    @IsArray({ message: '$property| meta(s): precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| meta(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| meta(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Expose()
    metas?: [];

    @IsOptional()
    @IsArray({ message: '$property| tag(s): precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| tag(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| tag(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Expose()
    tags?: [];

    @IsBoolean()
    @Expose()
    listar_variaveis_regionalizadas: boolean;
}
