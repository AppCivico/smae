import { ApiProperty } from '@nestjs/swagger';
import { CampoVinculo } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class FilterVinculoDto {
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    meta_id?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    projeto_id?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    transferencia_id?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    distribuicao_id?: number;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    tipo_vinculo_id?: number;

    @IsOptional()
    @ApiProperty({ enum: CampoVinculo, enumName: 'CampoVinculo' })
    @IsEnum(CampoVinculo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(CampoVinculo).join(', '),
    })
    campo_vinculo?: CampoVinculo;
}
