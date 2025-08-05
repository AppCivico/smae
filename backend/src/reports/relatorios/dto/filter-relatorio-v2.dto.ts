import { ApiProperty } from '@nestjs/swagger';
import { FonteRelatorio, RelatorioVisibilidade, TipoRelatorio } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FilterRelatorioV2Dto {
    @IsOptional()
    @IsInt()
    @Transform(({ value }: any) => (value ? +value : undefined))
    pdm_id?: number;

    @IsOptional()
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio)
    fonte?: FonteRelatorio;

    @IsOptional()
    @ApiProperty({ enum: TipoRelatorio, enumName: 'TipoRelatorio' })
    @IsEnum(TipoRelatorio)
    tipo?: TipoRelatorio;

    @IsOptional()
    @ApiProperty({ enum: RelatorioVisibilidade, enumName: 'RelatorioVisibilidade' })
    @IsEnum(RelatorioVisibilidade)
    visibilidade?: RelatorioVisibilidade;

    @IsOptional()
    @IsDateString()
    criado_em_de?: string;

    @IsOptional()
    @IsDateString()
    criado_em_ate?: string;

    @IsOptional()
    @IsString()
    token_paginacao?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Transform((a: TransformFnParams) => (a.value === '' ? 1 : +a.value))
    pagina?: number = 1;

    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform((a: TransformFnParams) => (a.value === '' ? 25 : +a.value))
    ipp?: number = 25;
}
