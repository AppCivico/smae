import { ApiProperty } from '@nestjs/swagger';
import { CampoVinculo } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class FilterVinculoDto {
    @IsNumber()
    @IsOptional()
    meta_id?: number;

    @IsNumber()
    @IsOptional()
    projeto_id?: number;

    @IsNumber()
    @IsOptional()
    transferencia_id?: number;

    @IsNumber()
    @IsOptional()
    distribuicao_id?: number;

    @IsNumber()
    @IsOptional()
    tipo_vinculo_id?: number;

    @IsOptional()
    @ApiProperty({ enum: CampoVinculo, enumName: 'CampoVinculo' })
    @IsEnum(CampoVinculo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(CampoVinculo).join(', '),
    })
    campo_vinculo?: CampoVinculo;
}
